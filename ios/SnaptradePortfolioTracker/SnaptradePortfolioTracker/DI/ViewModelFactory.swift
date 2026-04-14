// Factory responsible for creating ViewModels
// Holds an AuthenticatedContainer and injects APIGateway instances into each ViewModel
final class ViewModelFactory {
    private let container: AuthenticatedContainer

    init(container: AuthenticatedContainer) {
        self.container = container
    }

    func makeAccountsViewModel() -> AccountsViewModel {
        AccountsViewModel(gateway: SnaptradeAPIGateway(client: container.apiClient))
    }

    func makePortfolioDetailViewModel(accountId: String) -> PortfolioDetailViewModel {
        PortfolioDetailViewModel(
            holdingsGateway: HoldingsAPIGateway(client: container.apiClient),
            transactionsGateway: TransactionsAPIGateway(client: container.apiClient),
            accountId: accountId
        )
    }
}
