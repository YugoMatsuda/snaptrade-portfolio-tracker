import Foundation
import OpenAPIURLSession

// 認証済みユーザーの依存関係を管理するコンテナ
// JWTをもとにAPIクライアントなどを初期化し、各ViewModelに注入する
final class AuthenticatedContainer {
    let apiClient: Client

    init(jwt: String) {
        apiClient = Client(
            serverURL: URL(string: "http://localhost:8000/api")!,
            transport: URLSessionTransport(),
            middlewares: [AuthMiddleware(token: jwt)]
        )
    }
}
