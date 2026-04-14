import OpenAPIRuntime

typealias APIConnection = Operations.snaptrade_period_accounts.Output.Ok.Body.jsonPayload.connectionsPayloadPayload
typealias APIAccount = APIConnection.accountsPayloadPayload

extension Account {
    init(_ a: APIAccount) {
        self.init(
            id: a.id,
            name: a.name,
            number: a.number
        )
    }
}

extension Connection {
    init(_ c: APIConnection) {
        self.init(
            authorizationId: c.authorizationId,
            institutionName: c.institutionName,
            isDisabled: c.isDisabled,
            accounts: c.accounts.map { Account($0) }
        )
    }
}
