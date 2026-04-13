import Foundation
import Observation

@MainActor
@Observable
final class AccountsViewModel {
    enum State {
        case idle
        case loading
        case notConnected
        case loaded([Connection])
        case error(String)
    }

    var state: State = .idle
    var redirectURI: String? = nil

    private let gateway: SnaptradeAPIGateway

    init(gateway: SnaptradeAPIGateway) {
        self.gateway = gateway
    }

    func fetchAccounts() async {
        state = .loading
        do {
            let connections = try await gateway.fetchConnections()
            state = .loaded(connections)
        } catch {
            // SnapTrade未登録（user_secretなし）はnotConnectedとして扱う
            state = .notConnected
        }
    }

    func connect() async {
        do {
            redirectURI = try await gateway.connect()
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func onConnectionCompleted() async {
        redirectURI = nil
        do {
            try await gateway.sync()
        } catch {
            state = .error(error.localizedDescription)
            return
        }
        await fetchAccounts()
    }

    func deleteConnection(_ connection: Connection) async {
        do {
            try await gateway.deleteConnection(authorizationId: connection.authorizationId)
            await fetchAccounts()
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func deleteSnapTradeUser() async {
        do {
            try await gateway.deleteSnapTradeUser()
            state = .notConnected
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
