# SwiftData Guide Reference

## Model Definition

```swift
import SwiftData

@Model
final class Project {
    var name: String
    var clientName: String
    var address: String
    var startDate: Date
    var estimatedEndDate: Date?
    var status: ProjectStatus
    var notes: String
    var totalBudget: Decimal
    
    // One-to-many
    @Relationship(deleteRule: .cascade)
    var tasks: [ProjectTask] = []
    
    @Relationship(deleteRule: .cascade)
    var expenses: [Expense] = []
    
    // Many-to-many
    @Relationship(inverse: \Staff.projects)
    var assignedStaff: [Staff] = []
    
    // Computed properties (not persisted)
    var totalExpenses: Decimal {
        expenses.reduce(0) { $0 + $1.amount }
    }
    
    var profit: Decimal {
        totalBudget - totalExpenses
    }
    
    var completionPercentage: Double {
        guard !tasks.isEmpty else { return 0 }
        let completed = tasks.filter { $0.isCompleted }.count
        return Double(completed) / Double(tasks.count)
    }
    
    init(name: String, clientName: String, address: String, budget: Decimal) {
        self.name = name
        self.clientName = clientName
        self.address = address
        self.startDate = .now
        self.status = .planning
        self.notes = ""
        self.totalBudget = budget
    }
}

@Model
final class Staff {
    var name: String
    var email: String
    var phone: String
    var role: StaffRole
    var hourlyRate: Decimal
    var isActive: Bool
    
    @Relationship(inverse: \Project.assignedStaff)
    var projects: [Project] = []
    
    @Relationship(deleteRule: .cascade)
    var timeEntries: [TimeEntry] = []
    
    init(name: String, email: String, role: StaffRole, hourlyRate: Decimal) {
        self.name = name
        self.email = email
        self.phone = ""
        self.role = role
        self.hourlyRate = hourlyRate
        self.isActive = true
    }
}

@Model
final class TimeEntry {
    var checkIn: Date
    var checkOut: Date?
    var lunchBreakMinutes: Int
    var latitude: Double?
    var longitude: Double?
    var isApproved: Bool
    
    @Relationship
    var staff: Staff?
    
    @Relationship
    var project: Project?
    
    var workedHours: Double {
        guard let checkOut else { return 0 }
        let total = checkOut.timeIntervalSince(checkIn) / 3600
        let lunchHours = Double(lunchBreakMinutes) / 60
        return max(0, total - lunchHours)
    }
    
    var earnings: Decimal {
        guard let staff else { return 0 }
        return staff.hourlyRate * Decimal(workedHours)
    }
}
```

## Enums for SwiftData

```swift
// ✅ Use Codable enums — SwiftData stores them as raw values
enum ProjectStatus: String, Codable, CaseIterable {
    case planning = "Planning"
    case inProgress = "In Progress"
    case onHold = "On Hold"
    case completed = "Completed"
    
    var color: Color {
        switch self {
        case .planning: .blue
        case .inProgress: .orange
        case .onHold: .yellow
        case .completed: .green
        }
    }
    
    var icon: String {
        switch self {
        case .planning: "pencil.and.ruler"
        case .inProgress: "paintbrush"
        case .onHold: "pause.circle"
        case .completed: "checkmark.circle.fill"
        }
    }
}

enum StaffRole: String, Codable, CaseIterable {
    case admin, painter, leadPainter, helper
}
```

## Container Setup

```swift
@main
struct PainterProApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [
            Project.self,
            Staff.self,
            TimeEntry.self,
            Expense.self
        ])
    }
}

// ✅ Custom container with configuration
let container = try ModelContainer(
    for: Project.self, Staff.self,
    configurations: ModelConfiguration(
        "PainterPro",
        schema: Schema([Project.self, Staff.self]),
        isStoredInMemoryOnly: false,
        cloudKitDatabase: .automatic // Enable CloudKit sync
    )
)
```

## Queries

```swift
// ✅ Basic query with sorting
struct ProjectListView: View {
    @Query(
        filter: #Predicate<Project> { $0.status != .completed },
        sort: [SortDescriptor(\Project.startDate, order: .reverse)]
    )
    private var activeProjects: [Project]
    
    var body: some View {
        List(activeProjects) { project in
            ProjectRow(project: project)
        }
    }
}

// ✅ Dynamic query with search
struct StaffSearchView: View {
    @State private var searchText = ""
    
    var body: some View {
        StaffListContent(searchText: searchText)
            .searchable(text: $searchText)
    }
}

struct StaffListContent: View {
    let searchText: String
    
    // Dynamic predicate based on search
    init(searchText: String) {
        self.searchText = searchText
        let predicate: Predicate<Staff>
        if searchText.isEmpty {
            predicate = #Predicate { $0.isActive }
        } else {
            predicate = #Predicate { staff in
                staff.isActive && staff.name.localizedStandardContains(searchText)
            }
        }
        _staff = Query(filter: predicate, sort: \Staff.name)
    }
    
    @Query private var staff: [Staff]
    
    var body: some View {
        List(staff) { member in
            StaffRow(staff: member)
        }
    }
}
```

## CRUD Operations

```swift
struct ProjectManager {
    let context: ModelContext
    
    // Create
    func createProject(name: String, client: String, budget: Decimal) {
        let project = Project(name: name, clientName: client, address: "", budget: budget)
        context.insert(project)
        // Auto-saves — no explicit save needed (SwiftData auto-saves)
    }
    
    // Read
    func fetchActiveProjects() throws -> [Project] {
        let descriptor = FetchDescriptor<Project>(
            predicate: #Predicate { $0.status != .completed },
            sortBy: [SortDescriptor(\.startDate, order: .reverse)]
        )
        return try context.fetch(descriptor)
    }
    
    // Update (just modify properties directly)
    func completeProject(_ project: Project) {
        project.status = .completed
        // Auto-saves
    }
    
    // Delete
    func deleteProject(_ project: Project) {
        context.delete(project) // Cascades to tasks/expenses
    }
    
    // Batch operations
    func deleteAllCompleted() throws {
        try context.delete(
            model: Project.self,
            where: #Predicate { $0.status == .completed }
        )
    }
}
```

## Schema Migration

```swift
// ✅ Versioned schema
enum PainterProSchemaV1: VersionedSchema {
    static var versionIdentifier = Schema.Version(1, 0, 0)
    static var models: [any PersistentModel.Type] {
        [Project.self, Staff.self]
    }
    
    @Model final class Project {
        var name: String
        var status: String
        // V1 fields...
    }
}

enum PainterProSchemaV2: VersionedSchema {
    static var versionIdentifier = Schema.Version(2, 0, 0)
    static var models: [any PersistentModel.Type] {
        [Project.self, Staff.self, TimeEntry.self]
    }
    
    @Model final class Project {
        var name: String
        var status: ProjectStatus // Changed from String to enum
        var totalBudget: Decimal  // New field
    }
}

// Migration plan
enum PainterProMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [PainterProSchemaV1.self, PainterProSchemaV2.self]
    }
    
    static var stages: [MigrationStage] {
        [migrateV1toV2]
    }
    
    static let migrateV1toV2 = MigrationStage.custom(
        fromVersion: PainterProSchemaV1.self,
        toVersion: PainterProSchemaV2.self
    ){ context in
        // Custom migration logic
    }
}
```

## Best Practices

- **No manual save calls** — SwiftData auto-saves on context changes
- **Use `@Query` in views** — It's reactive and efficient
- **`#Predicate` over NSPredicate** — Type-safe, compile-time checked
- **`@Relationship` for all connections** — Ensures referential integrity
- **Codable enums** for status/type fields — Clean, type-safe storage
- **Computed properties** for derived values — Not persisted, always fresh
- **`@Transient`** for properties you don't want to persist
