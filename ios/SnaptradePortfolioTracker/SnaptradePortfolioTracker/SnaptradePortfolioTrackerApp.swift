import Supabase
import SwiftUI

enum AuthState {
    case loading
    case unauthenticated
    case authenticated(jwt: String)
}

@main
struct SnaptradePortfolioTrackerApp: App {
    @State private var authState: AuthState = .loading

    var body: some Scene {
        WindowGroup {
            Group {
                switch authState {
                case .loading:
                    ProgressView()
                case .unauthenticated:
                    AuthView()
                case .authenticated(let jwt):
                    AuthenticatedView(jwt: jwt)
                }
            }
            .task {
                // アプリ起動時にセッションを確認（再ログイン不要にする）
                if let session = try? await supabase.auth.session {
                    authState = .authenticated(jwt: session.accessToken)
                } else {
                    authState = .unauthenticated
                }
                // ログイン/ログアウトのイベントを監視
                for await (event, session) in supabase.auth.authStateChanges {
                    switch event {
                    case .signedIn:
                        if let token = session?.accessToken {
                            authState = .authenticated(jwt: token)
                        }
                    case .signedOut:
                        authState = .unauthenticated
                    default:
                        break
                    }
                }
            }
        }
    }
}
