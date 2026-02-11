---
name: swift-ios
description: Native iOS development with Swift 6, SwiftUI, SwiftData, and Apple frameworks. Use for iOS app architecture, Swift concurrency, UI patterns, testing with XCTest, and App Store deployment.
license: MIT
version: 1.0.0
---

# Swift & iOS Development Skill

Expert-level Swift/SwiftUI development for production iOS applications following Apple's latest patterns and best practices.

## When to Use

- Building native iOS applications with Swift/SwiftUI
- Implementing Swift 6 strict concurrency and modern patterns
- Designing with SwiftUI (navigation, state management, animations)
- Working with SwiftData, Core Data, or CloudKit
- Writing tests with XCTest and Swift Testing framework
- Implementing iOS-specific features (push notifications, widgets, App Clips)
- Following Apple Human Interface Guidelines (HIG)
- Deploying to App Store via TestFlight
- Performance profiling with Instruments

## Swift 6 Language Essentials

### Strict Concurrency (Swift 6 Default)

```swift
// ✅ Actor isolation — Swift 6 enforces Sendable
actor DataStore {
    private var items: [Item] = []
    
    func add(_ item: Item) {
        items.append(item)
    }
    
    func getAll() -> [Item] {
        items
    }
}

// ✅ @MainActor for UI-bound code
@MainActor
final class ViewModel: ObservableObject {
    @Published private(set) var items: [Item] = []
    
    private let store: DataStore
    
    func loadItems() async {
        items = await store.getAll()
    }
}

// ✅ Sendable conformance for data passed across boundaries
struct Item: Sendable, Identifiable, Codable {
    let id: UUID
    let title: String
    let createdAt: Date
}
```

### Modern Swift Patterns

```swift
// ✅ if/switch expressions (Swift 5.9+)
let icon = if isCompleted { "checkmark.circle.fill" } else { "circle" }

// ✅ Macro usage
@Observable  // Preferred over ObservableObject in iOS 17+
final class AppState {
    var user: User?
    var isAuthenticated: Bool { user != nil }
}

// ✅ Non-copyable types (Swift 5.9+)
struct UniqueToken: ~Copyable {
    let value: String
    consuming func redeem() -> String { value }
}

// ✅ Parameter packs (variadic generics)
func allSatisfy<each T: Equatable>(_ value: repeat each T, equals other: repeat each T) -> Bool {
    for (a, b) in repeat (each value, each other) {
        guard a == b else { return false }
    }
    return true
}
```

## SwiftUI Architecture

### Recommended: MVVM + Router

```
Feature/
├── Models/
│   └── item.swift
├── Views/
│   ├── item-list-view.swift
│   └── item-detail-view.swift
├── ViewModels/
│   └── item-list-view-model.swift
├── Services/
│   └── item-service.swift
└── Router/
    └── item-router.swift
```

### State Management Hierarchy

| Scope | Tool | When |
|-------|------|------|
| View-local | `@State` | Simple UI state (toggles, text fields) |
| Child → Parent | `@Binding` | Pass mutable state to child views |
| Observation | `@Observable` (iOS 17+) | Shared data model, replaces `ObservableObject` |
| Legacy observation | `@ObservedObject` / `@StateObject` | Pre-iOS 17 compatibility |
| App-wide | `@Environment` | Theme, locale, auth state |
| Persistence | `@Query` (SwiftData) | Database-backed lists |

### Navigation (iOS 16+)

```swift
// ✅ NavigationStack with type-safe routing
enum AppRoute: Hashable {
    case projectDetail(Project)
    case staffProfile(Staff)
    case settings
}

struct ContentView: View {
    @State private var path = NavigationPath()
    
    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .projectDetail(let project):
                        ProjectDetailView(project: project)
                    case .staffProfile(let staff):
                        StaffProfileView(staff: staff)
                    case .settings:
                        SettingsView()
                    }
                }
        }
    }
}
```

## SwiftData (iOS 17+)

```swift
import SwiftData

@Model
final class Project {
    var name: String
    var startDate: Date
    var status: ProjectStatus
    
    @Relationship(deleteRule: .cascade)
    var tasks: [ProjectTask] = []
    
    @Relationship(inverse: \Staff.projects)
    var assignedStaff: [Staff] = []
    
    init(name: String, startDate: Date = .now) {
        self.name = name
        self.startDate = startDate
        self.status = .planning
    }
}

enum ProjectStatus: String, Codable, CaseIterable {
    case planning, inProgress, completed, onHold
}

// Usage in View
struct ProjectListView: View {
    @Query(sort: \Project.startDate, order: .reverse)
    private var projects: [Project]
    
    @Environment(\.modelContext) private var context
    
    var body: some View {
        List(projects) { project in
            ProjectRow(project: project)
        }
    }
    
    private func addProject(name: String) {
        let project = Project(name: name)
        context.insert(project)
    }
}
```

## Networking Layer

```swift
// Protocol-based for testability
protocol APIClientProtocol: Sendable {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}

actor APIClient: APIClientProtocol {
    private let session: URLSession
    private let decoder: JSONDecoder
    
    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
    }
    
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        let (data, response) = try await session.data(for: endpoint.urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)
        }
        
        return try decoder.decode(T.self, from: data)
    }
}

// Type-safe endpoints
struct Endpoint {
    let path: String
    let method: HTTPMethod
    let body: Encodable?
    let queryItems: [URLQueryItem]
    
    var urlRequest: URLRequest {
        var components = URLComponents(string: "https://api.example.com")!
        components.path = path
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        
        var request = URLRequest(url: components.url!)
        request.httpMethod = method.rawValue
        if let body {
            request.httpBody = try? JSONEncoder().encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        return request
    }
}
```

## Testing

### Swift Testing Framework (Xcode 16+)

```swift
import Testing
@testable import PainterPro

@Suite("Project Management Tests")
struct ProjectTests {
    
    @Test("Create project with valid name")
    func createProject() {
        let project = Project(name: "Kitchen Remodel")
        #expect(project.name == "Kitchen Remodel")
        #expect(project.status == .planning)
        #expect(project.tasks.isEmpty)
    }
    
    @Test("Calculate total cost", arguments: [
        (hours: 8.0, rate: 25.0, expected: 200.0),
        (hours: 0.0, rate: 25.0, expected: 0.0),
        (hours: 4.5, rate: 30.0, expected: 135.0),
    ])
    func calculateCost(hours: Double, rate: Double, expected: Double) {
        let cost = hours * rate
        #expect(cost == expected)
    }
    
    @Test("Fetch projects from API")
    func fetchProjects() async throws {
        let mockClient = MockAPIClient()
        let viewModel = ProjectListViewModel(apiClient: mockClient)
        
        await viewModel.loadProjects()
        
        #expect(viewModel.projects.count == 3)
        #expect(viewModel.error == nil)
    }
}
```

### XCTest (Legacy / UI Tests)

```swift
import XCTest
@testable import PainterPro

final class ProjectServiceTests: XCTestCase {
    var sut: ProjectService!
    var mockStore: MockDataStore!
    
    override func setUp() {
        super.setUp()
        mockStore = MockDataStore()
        sut = ProjectService(store: mockStore)
    }
    
    override func tearDown() {
        sut = nil
        mockStore = nil
        super.tearDown()
    }
    
    func testAddProjectSavesToStore() async throws {
        try await sut.addProject(name: "Test Project")
        XCTAssertEqual(mockStore.savedProjects.count, 1)
    }
}

// UI Test
final class ProjectListUITests: XCTestCase {
    let app = XCUIApplication()
    
    override func setUp() {
        continueAfterFailure = false
        app.launch()
    }
    
    func testAddNewProject() {
        app.buttons["addProject"].tap()
        app.textFields["projectName"].tap()
        app.textFields["projectName"].typeText("New Project")
        app.buttons["save"].tap()
        
        XCTAssertTrue(app.staticTexts["New Project"].exists)
    }
}
```

## Error Handling

```swift
// Domain-specific errors
enum AppError: LocalizedError {
    case networkUnavailable
    case unauthorized
    case serverError(statusCode: Int)
    case decodingFailed(underlying: Error)
    case validationFailed(field: String, reason: String)
    
    var errorDescription: String? {
        switch self {
        case .networkUnavailable:
            "No internet connection. Please check your network."
        case .unauthorized:
            "Session expired. Please log in again."
        case .serverError(let code):
            "Server error (\(code)). Please try again later."
        case .decodingFailed:
            "Unable to process server response."
        case .validationFailed(let field, let reason):
            "\(field): \(reason)"
        }
    }
}

// Result builder for validation
@resultBuilder
struct ValidationBuilder {
    static func buildBlock(_ components: ValidationResult...) -> [ValidationResult] {
        components
    }
}

func validate(@ValidationBuilder rules: () -> [ValidationResult]) throws {
    let results = rules()
    let errors = results.compactMap { $0.error }
    if !errors.isEmpty {
        throw ValidationErrors(errors)
    }
}
```

## Authentication Patterns

```swift
// Keychain wrapper for secure storage
actor KeychainService {
    func save(_ data: Data, for key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }
    
    func load(for key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess else { return nil }
        return result as? Data
    }
}

// Sign in with Apple
import AuthenticationServices

struct SignInWithAppleButton: View {
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        SignInWithAppleButton(.signIn) { request in
            request.requestedScopes = [.fullName, .email]
        } onCompletion: { result in
            switch result {
            case .success(let authorization):
                handleAuthorization(authorization)
            case .failure(let error):
                handleError(error)
            }
        }
        .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
        .frame(height: 50)
    }
}
```

## Performance Guidelines

**Build & Compile:**
- Run `Cmd+B` after every file change to catch errors early
- Use `swift build` in terminal for CLI validation

**Instruments Profiling Targets:**

| Metric | Target | Tool |
|--------|--------|------|
| App launch | < 400ms (warm), < 2s (cold) | Time Profiler |
| Memory | < 50MB idle, < 150MB active | Allocations |
| Scrolling | 60 FPS, 0 hitches | Core Animation |
| Network | < 3s API response | Network |
| Battery | < 3% drain/hour | Energy Log |

**SwiftUI Performance:**
- Use `@Observable` over `@ObservableObject` (finer-grained updates)
- Prefer `LazyVStack` / `LazyHStack` for large lists
- Use `.task` modifier instead of `.onAppear` for async work
- Profile with `Self._printChanges()` debug method

## Project Structure (Recommended)

```
PainterPro/
├── App/
│   ├── painter-pro-app.swift          # @main entry
│   └── app-delegate.swift             # Push notifications, etc.
├── Core/
│   ├── Models/                        # SwiftData models
│   ├── Services/                      # Business logic
│   ├── Networking/                    # API client & endpoints
│   ├── Storage/                       # Keychain, UserDefaults
│   └── Extensions/                    # Swift extensions
├── Features/
│   ├── Authentication/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Services/
│   ├── Projects/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Services/
│   └── Staff/
│       ├── Views/
│       ├── ViewModels/
│       └── Services/
├── UI/
│   ├── Components/                    # Reusable UI components
│   ├── Theme/                         # Colors, fonts, spacing
│   └── Modifiers/                     # Custom ViewModifiers
├── Resources/
│   ├── Assets.xcassets
│   └── Localizable.xcstrings
└── Tests/
    ├── UnitTests/
    ├── IntegrationTests/
    └── UITests/
```

## Reference Navigation

- `references/swift-concurrency.md` — async/await, actors, Sendable, TaskGroups, structured concurrency
- `references/swiftui-patterns.md` — View composition, custom modifiers, animations, gestures, accessibility
- `references/swiftdata-guide.md` — Models, relationships, queries, migrations, CloudKit sync
- `references/ios-frameworks.md` — MapKit, CoreLocation, AVFoundation, WidgetKit, App Intents
- `references/app-store-deployment.md` — TestFlight, screenshots, review guidelines, CI/CD with Xcode Cloud

## Quick Checklist

- [ ] Swift 6 language mode enabled in build settings
- [ ] Strict concurrency checking = Complete
- [ ] Minimum deployment target set (iOS 17+ recommended)
- [ ] SwiftData container configured in App struct
- [ ] Error handling with typed errors
- [ ] Keychain for sensitive data (never UserDefaults)
- [ ] `@MainActor` on all ViewModels
- [ ] Tests using Swift Testing framework
- [ ] Accessibility labels on interactive elements
- [ ] Dark mode support verified
