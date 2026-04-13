// ViewModelの生成を担うファクトリー
// AuthenticatedContainerを保持し、APIGatewayを生成してViewModelに注入する
final class ViewModelFactory {
    private let container: AuthenticatedContainer

    init(container: AuthenticatedContainer) {
        self.container = container
    }

    func makeAccountsViewModel() -> AccountsViewModel {
        AccountsViewModel(gateway: SnaptradeAPIGateway(client: container.apiClient))
    }

    func makePortfolioDetailViewModel(accountId: String) -> PortfolioDetailViewModel {
        PortfolioDetailViewModel(service: HoldingsAPIGateway(client: container.apiClient), accountId: accountId)
    }
}
