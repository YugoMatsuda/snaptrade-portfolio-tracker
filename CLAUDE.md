# iOS コーディング規約

## 状態管理
- `isLoading: Bool` + `errorMessage: String?` のように状態を複数のプロパティに分散させない
- ViewModel の状態は `enum State { case idle, loading, loaded(...), error(...) }` にまとめる
- View 側は `switch viewModel.state` で網羅的に分岐する

# Xcode MCP Tools

Xcode MCP server (xcrun mcpbridge) is available for building, testing, and project inspection.

- Prefer Xcode MCP tools over xcodebuild when available — use BuildProject, RunSomeTests, RunAllTests, GetBuildLog, GetTestList
- Use XcodeRead, XcodeGrep, XcodeGlob, XcodeLS for project-aware file operations
- Use DocumentationSearch for Apple developer documentation lookups
- Use RenderPreview to verify SwiftUI preview output
- Requires: macOS 26.3+, Xcode 26.3+, and Xcode running
