import Supabase
import SwiftUI

@MainActor
@Observable
final class AuthViewModel {
    enum State: Equatable {
        case idle
        case loading
        case error(String)
    }

    var email = ""
    var password = ""
    var state: State = .idle

    func signUp() async {
        state = .loading
        do {
            try await supabase.auth.signUp(email: email, password: password)
            state = .idle
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func signIn() async {
        state = .loading
        do {
            try await supabase.auth.signIn(email: email, password: password)
            state = .idle
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}

struct AuthView: View {
    @State private var viewModel = AuthViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                TextField("Email", text: $viewModel.email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .textFieldStyle(.roundedBorder)

                SecureField("Password", text: $viewModel.password)
                    .textFieldStyle(.roundedBorder)

                if case .error(let message) = viewModel.state {
                    Text(message).foregroundStyle(.red).font(.caption)
                }

                Button("Sign In") {
                    Task { await viewModel.signIn() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.state == .loading)

                Button("Sign Up") {
                    Task { await viewModel.signUp() }
                }
                .disabled(viewModel.state == .loading)
            }
            .padding()
            .navigationTitle("Login")
        }
    }
}
