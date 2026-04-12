import SwiftUI

// 認証済み画面のルート
// ViewModelFactoryを保持し、認証後の画面遷移・ルーティングを管理する
struct AuthenticatedView: View {
    private let factory: ViewModelFactory

    init(jwt: String) {
        let container = AuthenticatedContainer(jwt: jwt)
        factory = ViewModelFactory(container: container)
    }

    var body: some View {
        HoldingsView(viewModel: factory.makeHoldingsViewModel())
        // TODO: Phase 5以降で口座一覧・パフォーマンス画面などへの遷移をここに追加
    }
}
