import SwiftUI

// Root view for authenticated users
// Holds a ViewModelFactory and manages navigation/routing after authentication
struct AuthenticatedView: View {
    private let factory: ViewModelFactory

    init(jwt: String) {
        let container = AuthenticatedContainer(jwt: jwt)
        factory = ViewModelFactory(container: container)
    }

    var body: some View {
        AccountsView(viewModel: factory.makeAccountsViewModel(), factory: factory)
    }
}
