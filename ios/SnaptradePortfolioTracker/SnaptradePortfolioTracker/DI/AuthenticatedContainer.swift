import Foundation
import OpenAPIURLSession

// Container that manages dependencies for an authenticated user
// Initializes the API client and other dependencies from a JWT, then injects them into each ViewModel
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
