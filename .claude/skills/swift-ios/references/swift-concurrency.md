# Swift Concurrency Reference

## async/await Basics

```swift
// ✅ Simple async function
func fetchUser(id: String) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: URL(string: "/users/\(id)")!)
    return try JSONDecoder().decode(User.self, from: data)
}

// ✅ Calling async from SwiftUI
struct UserView: View {
    @State private var user: User?
    let userId: String
    
    var body: some View {
        VStack {
            if let user { UserCard(user: user) }
            else { ProgressView() }
        }
        .task { // Preferred over .onAppear
            user = try? await fetchUser(id: userId)
        }
    }
}
```

## Structured Concurrency

```swift
// ✅ TaskGroup — parallel work with collected results
func fetchAllProjects() async throws -> [Project] {
    try await withThrowingTaskGroup(of: Project.self) { group in
        let projectIds = try await fetchProjectIds()
        
        for id in projectIds {
            group.addTask {
                try await fetchProject(id: id)
            }
        }
        
        var projects: [Project] = []
        for try await project in group {
            projects.append(project)
        }
        return projects
    }
}

// ✅ async let — known number of concurrent tasks
func loadDashboard() async throws -> Dashboard {
    async let projects = fetchProjects()
    async let staff = fetchStaff()
    async let stats = fetchStats()
    
    return try await Dashboard(
        projects: projects,
        staff: staff,
        stats: stats
    )
}
```

## Actors

```swift
// ✅ Actor for thread-safe mutable state
actor ImageCache {
    private var cache: [URL: UIImage] = [:]
    private var inProgress: [URL: Task<UIImage, Error>] = [:]
    
    func image(for url: URL) async throws -> UIImage {
        // Return cached
        if let cached = cache[url] { return cached }
        
        // Coalesce duplicate requests
        if let existing = inProgress[url] {
            return try await existing.value
        }
        
        // Start new fetch
        let task = Task {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data) else {
                throw ImageError.decodingFailed
            }
            return image
        }
        
        inProgress[url] = task
        let image = try await task.value
        cache[url] = image
        inProgress[url] = nil
        return image
    }
    
    func clearCache() {
        cache.removeAll()
    }
}

// ✅ @globalActor for custom isolation domains
@globalActor
actor DatabaseActor {
    static let shared = DatabaseActor()
}

@DatabaseActor
func performMigration() async {
    // Isolated to DatabaseActor
}
```

## Sendable Protocol

```swift
// ✅ Value types are automatically Sendable
struct ProjectUpdate: Sendable {
    let projectId: UUID
    let newStatus: ProjectStatus
    let updatedAt: Date
}

// ✅ Classes must be final with immutable stored properties
final class AppConfig: Sendable {
    let apiBaseURL: URL
    let apiKey: String
    let environment: Environment
}

// ✅ @unchecked Sendable — when you manage thread safety manually
final class AtomicCounter: @unchecked Sendable {
    private let lock = NSLock()
    private var _value: Int = 0
    
    var value: Int {
        lock.withLock { _value }
    }
    
    func increment() {
        lock.withLock { _value += 1 }
    }
}

// ✅ Sendable closures
func process(items: [Item], transform: @Sendable (Item) -> Result) async -> [Result] {
    await withTaskGroup(of: Result.self) { group in
        for item in items {
            group.addTask { transform(item) }
        }
        var results: [Result] = []
        for await result in group { results.append(result) }
        return results
    }
}
```

## Task Management

```swift
// ✅ Task cancellation
func searchAsYouType(query: String) {
    searchTask?.cancel()
    searchTask = Task {
        try await Task.sleep(for: .milliseconds(300)) // Debounce
        guard !Task.isCancelled else { return }
        
        let results = try await searchService.search(query)
        guard !Task.isCancelled else { return }
        
        await MainActor.run {
            self.searchResults = results
        }
    }
}

// ✅ Task priority
Task(priority: .userInitiated) {
    await loadVisibleContent()
}

Task.detached(priority: .background) {
    await prefetchImages()
}

// ✅ AsyncSequence
func observeLocationUpdates() async {
    for await location in locationManager.updates {
        await processLocation(location)
    }
}
```

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Blocking main thread with heavy computation | Use `Task.detached(priority: .background)` |
| Data race with shared mutable state | Use `actor` or `@MainActor` |
| Forgetting cancellation checks | Check `Task.isCancelled` in loops |
| Too many concurrent tasks | Use `TaskGroup` with limits |
| `@Sendable` closure capturing non-Sendable | Copy values before capture or make type Sendable |
| Deadlock with actor reentrancy | Design actors to handle reentrancy |
