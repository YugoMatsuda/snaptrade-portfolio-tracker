struct Account {
    let id: String
    let name: String?
    let number: String?
}

struct Connection {
    let authorizationId: String
    let institutionName: String?
    let accounts: [Account]
}
