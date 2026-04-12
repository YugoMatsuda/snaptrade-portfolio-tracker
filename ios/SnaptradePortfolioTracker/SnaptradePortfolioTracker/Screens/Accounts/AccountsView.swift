import SwiftUI
import SafariServices

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
                        SafariView(url: url).ignoresSafeArea()
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

private struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
