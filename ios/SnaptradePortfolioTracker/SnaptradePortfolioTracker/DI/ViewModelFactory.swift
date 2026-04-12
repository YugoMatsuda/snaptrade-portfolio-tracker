// ViewModelの生成を担うファクトリー
// AuthenticatedContainerを保持し、各ViewModelにAPIクライアントを注入する
final class ViewModelFactory {
    private let container: AuthenticatedContainer

    init(container: AuthenticatedContainer) {
        self.container = container
    }

    func makeHoldingsViewModel() -> HoldingsViewModel {
        HoldingsViewModel(client: container.apiClient)
    }
}
