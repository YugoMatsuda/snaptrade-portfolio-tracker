import SwiftUI
import WebKit

struct AccountsView: View {
    @State private var viewModel: AccountsViewModel
    private let factory: ViewModelFactory

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
                        Button("Connect") {
                            Task { await viewModel.connect() }
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
                Text("証券口座が連携されていません")
                    .foregroundStyle(.secondary)
                Button("Connect Brokerage") {
                    Task { await viewModel.connect() }
                }
                .buttonStyle(.borderedProminent)
            }
        case .error(let message):
            Text("Error: \(message)").foregroundStyle(.red)
        case .loaded(let accounts):
            List(accounts, id: \.id) { account in
                NavigationLink(destination: HoldingsView(viewModel: factory.makeHoldingsViewModel(accountId: account.id))) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(account.name ?? account.number ?? account.id)
                            .font(.headline)
                        if let institution = account.institutionName {
                            Text(institution)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
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
