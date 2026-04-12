// ViewModelの生成を担うファクトリー
// AuthenticatedContainerを保持し、APIGatewayを生成してViewModelに注入する
final class ViewModelFactory {
    private let container: AuthenticatedContainer

    init(container: AuthenticatedContainer) {
        self.container = container
    }

    func makeHoldingsViewModel() -> HoldingsViewModel {
        HoldingsViewModel(service: HoldingsAPIGateway(client: container.apiClient))
    }
}
