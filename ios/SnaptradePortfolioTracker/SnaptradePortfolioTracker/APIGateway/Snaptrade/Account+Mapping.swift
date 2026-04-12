import OpenAPIRuntime

typealias APIAccount = Operations.snaptrade_period_accounts.Output.Ok.Body.jsonPayload.accountsPayloadPayload

extension Account {
    init(_ a: APIAccount) {
        self.init(
            id: a.id,
            brokerageAuthorization: a.brokerage_authorization,
            name: a.name,
            number: a.number,
            institutionName: a.institution_name
        )
    }
}
