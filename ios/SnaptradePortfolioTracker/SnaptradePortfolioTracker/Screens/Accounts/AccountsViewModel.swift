import Foundation
import Observation

@MainActor
@Observable
final class AccountsViewModel {
    enum State {
        case idle
        case loading
        case loaded([Account])
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
            let accounts = try await gateway.fetchAccounts()
            state = .loaded(accounts)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func connect() async {
        do {
            redirectURI = try await gateway.connect()
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
