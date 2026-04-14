import SwiftUI
import WebKit

struct AccountsView: View {
    @State private var viewModel: AccountsViewModel
    private let factory: ViewModelFactory
    @State private var connectionToDelete: Connection? = nil
    @State private var showDeleteUserAlert = false

    init(viewModel: AccountsViewModel, factory: ViewModelFactory) {
        _viewModel = State(initialValue: viewModel)
        self.factory = factory
    }

    var body: some View {
        NavigationStack {
            bodyContent
                .navigationTitle("Accounts")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        if viewModel.isSyncing {
                            ProgressView()
                        } else {
                            Button("Connect") {
                                Task { await viewModel.connect() }
                            }
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        if case .loaded = viewModel.state {
                            Button("Sync") {
                                Task { await viewModel.manualSync() }
                            }
                            .disabled(viewModel.isSyncing)
                        }
                    }
                    ToolbarItem(placement: .topBarLeading) {
                        if case .loaded = viewModel.state {
                            Button("Delete Account", role: .destructive) {
                                showDeleteUserAlert = true
                            }
                        }
                    }
                }
                .sheet(isPresented: Binding(
                    get: { viewModel.redirectURI != nil },
                    set: { if !$0 { viewModel.redirectURI = nil } }
                )) {
                    if let uri = viewModel.redirectURI, let url = URL(string: uri) {
                        ConnectWebView(url: url) {
                            Task { await viewModel.onConnectionCompleted() }
                        }
                    }
                }
                .alert("Delete Connection", isPresented: Binding(
                    get: { connectionToDelete != nil },
                    set: { if !$0 { connectionToDelete = nil } }
                )) {
                    Button("Delete", role: .destructive) {
                        if let connection = connectionToDelete {
                            Task { await viewModel.deleteConnection(connection) }
                        }
                        connectionToDelete = nil
                    }
                    Button("Cancel", role: .cancel) { connectionToDelete = nil }
                } message: {
                    if let connection = connectionToDelete {
                        Text("Are you sure you want to delete the connection for \(connection.institutionName ?? connection.authorizationId)?")
                    }
                }
                .alert("Delete SnapTrade Account", isPresented: $showDeleteUserAlert) {
                    Button("Delete", role: .destructive) {
                        Task { await viewModel.deleteSnapTradeUser() }
                    }
                    Button("Cancel", role: .cancel) {}
                } message: {
                    Text("All connections and data will be deleted. This action cannot be undone.")
                }
                .task {
                    await viewModel.fetchAccounts()
                }
        }
    }

    @ViewBuilder
    private var bodyContent: some View {
        switch viewModel.state {
        case .idle, .loading:
            ProgressView("Loading...")
        case .notConnected:
            VStack(spacing: 16) {
                Text("No brokerage account linked")
                    .foregroundStyle(.secondary)
                Button("Connect Brokerage") {
                    Task { await viewModel.connect() }
                }
                .buttonStyle(.borderedProminent)
            }
        case .error(let message):
            Text("Error: \(message)").foregroundStyle(.red)
        case .loaded(let connections):
            List {
                ForEach(connections, id: \.authorizationId) { connection in
                    Section {
                        ForEach(connection.accounts, id: \.id) { account in
                            NavigationLink(destination: PortfolioDetailView(viewModel: factory.makePortfolioDetailViewModel(accountId: account.id))) {
                                Text(account.name ?? account.number ?? account.id)
                            }
                        }
                    } header: {
                        HStack {
                            Text(connection.institutionName ?? connection.authorizationId)
                            if connection.isDisabled {
                                Text("Expired")
                                    .font(.caption2)
                                    .foregroundStyle(.red)
                            }
                            Spacer()
                            if connection.isDisabled {
                                Button("Reconnect") {
                                    Task { await viewModel.reconnect(connection) }
                                }
                                .font(.caption)
                                .foregroundStyle(.orange)
                            }
                            Button("Delete", role: .destructive) {
                                connectionToDelete = connection
                            }
                            .font(.caption)
                        }
                    }
                }
            }
        }
    }
}

private struct SnapTradeNavigationDecider: WebPage.NavigationDeciding {
    let onConnected: () -> Void

    mutating func decidePolicy(
        for action: WebPage.NavigationAction,
        preferences: inout WebPage.NavigationPreferences
    ) async -> WKNavigationActionPolicy {
        guard let url = action.request.url, url.scheme == "snaptrade" else {
            return .allow
        }
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let status = components?.queryItems?.first(where: { $0.name == "status" })?.value
        if status == "SUCCESS" {
            onConnected()
        }
        return .cancel
    }
}

@MainActor
private struct ConnectWebView: View {
    let url: URL
    let onConnected: () -> Void

    @State private var page: WebPage

    init(url: URL, onConnected: @escaping () -> Void) {
        self.url = url
        self.onConnected = onConnected
        let decider = SnapTradeNavigationDecider(onConnected: onConnected)
        self._page = State(initialValue: WebPage(navigationDecider: decider))
    }

    var body: some View {
        WebView(page)
            .task { page.load(URLRequest(url: url)) }
            .ignoresSafeArea()
    }
}
