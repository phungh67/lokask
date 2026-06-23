[⬅ Return to Main Compendium](../../../README.md)

## 💻 Architectural Design Documentation: Lokask Platform

**Role:** Senior Frontend Officer
**Specialization:** TypeScript, Vite, Component Architecture, State Management
**Goal:** To document the modular structure and logic flow for the Lokask web application, ensuring high performance, maintainability, and strong type safety using modern frontend best practices.

---

### 💡 1. System Overview & Philosophy

The Lokask platform is a content-heavy, information-centric application focused on connecting users with local advice. Performance (especially Lighthouse scores) and type safety are paramount.

**Technology Stack Foundation:**
*   **Framework:** React (or equivalent modern component library, optimized for Vite).
*   **Language:** TypeScript (Mandatory for all component and utility logic).
*   **Bundler/Tooling:** Vite (Leveraging Hot Module Replacement (HMR) and optimized build pipelines).
*   **Styling:** CSS Modules or Styled Components (to ensure scope isolation).

**Core Design Principle:** Separation of Concerns. All components must be highly atomic, pure functions (where possible), and receive all necessary state and handlers via props.

### 🏗️ 2. Component Architecture (Component Tree)

We will implement a hierarchical, modular structure following the principles of Atomic Design (Atoms $\rightarrow$ Molecules $\rightarrow$ Organisms $\rightarrow$ Templates $\rightarrow$ Pages).

#### A. Atomic Components (The smallest, stateless units)
These are highly reusable UI elements that require minimal logic and are styled via CSS Modules.

*   `Button`: (Props: `variant: 'primary' | 'secondary'`, `isLoading: boolean`, `onClick: () => void`).
*   `Input`: (Props: `type: string`, `placeholder: string`, `value: string`, `onChange: (e: React.ChangeEvent<HTMLInputElement>) => void`).
*   `Card`: (Props: `children: React.ReactNode`, `hasShadow: boolean`).
*   `Badge`: (Props: `label: string`, `color: 'green' | 'blue'`).

#### B. Molecular Components (Combinations of Atoms)
These combine atomic units to form self-contained widgets.

*   `SearchForm`: (`Input` + `Button`). Handles local input state and submission logic.
*   `RecommendationTile`: (`Card` + `Badge` + `Button`). Displays a summarized piece of local knowledge.
*   `UserProfileSummary`: (`Avatar` + `Text` + `Badge`). Displays key user information.

#### C. Organic Components (Complex, stateful entities)
These components manage significant local state and orchestrate interactions between molecules.

*   `KnowledgeFeed`: Responsible for fetching and displaying paginated lists of local advice. Handles loading states, infinite scrolling logic, and error handling.
*   `ChatInterface`: Manages the conversational state, message history, and input stream.
*   `Header`: Global navigation logic, containing state for mobile menu visibility and user authentication status.

#### D. Page Components (The entry points)
These components connect the state management layer (Context/Store) to the complex organic components. They define the layout structure.

*   `/src/pages/HomePage.tsx`: (Renders `Header` + Hero Section + `KnowledgeFeed`).
*   `/src/pages/ProfilePage.tsx`: (Renders `Header` + `UserProfileSummary` + `KnowledgeFeed`).

### ⚙️ 3. State Management Strategy (TypeScript Focus)

Given the complexity of user interaction (chatting, feeding knowledge, authentication), we must use a centralized, predictable state management pattern.

**Recommendation:** A combination of **React Context API** (for global, low-frequency state like Auth Status) and a dedicated state library like **Zustand** (for complex, high-frequency, and domain-specific state like chat messages or filtering parameters).

| State Domain | Mechanism | Purpose | TypeScript Impact |
| :--- | :--- | :--- | :--- |
| **Authentication** | React Context Provider | Holds `currentUser: User | null`, `isAuthenticated: boolean`. Accessed globally via `useAuth()`. | Defines strict `User` interface for type safety across components. |
| **Chat/Conversation** | Zustand Store (`useChatStore`) | Manages `messages: Message[]`, `isLoading: boolean`, and `scrollToBottom`. | Messages array enforces strict message structure (`{ sender: User, content: string, timestamp: Date }`). |
| **Knowledge Feed** | Local Component State + Query Library (e.g., TanStack Query) | Manages fetching state (`isLoading`, `isError`, `data`), pagination parameters, and caching. | Query hook inputs and output types are strictly defined based on the API response schema. |
| **UI State** | Local Component State (`useState`) | Handles minor, ephemeral state (e.g., `isMenuOpen`, `inputValue`). | Limits the scope of state, preventing unnecessary global overhead. |

### 🔄 4. UI Logic Flow & Implementation Details

#### A. Data Flow (One-Way Data Flow)
1.  **Action:** User clicks 'Ask a Question' on the `HomePage`.
2.  **Handler:** The `HomePage` component calls the `handleSubmitQuery` function provided by the `useChatStore` hook.
3.  **State Update:** The `useChatStore` dispatches a state update (`isLoading: true`, adding a 'User' message to `messages`).
4.  **API Interaction:** The handler sends the payload to the API.
5.  **State Update:** Upon success, the API response is processed (mapped to the `Message` type) and the store is updated (`messages.push(apiResponseMessage)`, `isLoading: false`).
6.  **Rendering:** The `ChatInterface` component subscribes to the `useChatStore` and automatically re-renders with the new message list.

#### B. TypeScript Best Practices
*   **Interface Definitions:** Every API response, prop set, and state slice must have a corresponding TypeScript interface (`interface LocationAdvice {}`, `type MessagePayload = {...}`).
*   **Strict Typing:** Utilize `React.FC` (Functional Component) and enforce prop typing aggressively. Never assume the type of external data.
*   **Generics:** Use Generics when writing reusable hooks (e.g., `useQuery<TData, TError>(...)`) to ensure type safety regardless of the data shape.

#### C. Vite Integration & Optimization
*   **File Structure:** Maintain a dedicated `src/components`, `src/store`, and `src/api` directory for clear separation.
*   **Lazy Loading:** Implement `React.lazy()` and `Suspense` for all routes and large components (e.g., `ProfilePage`, `KnowledgeFeed`). This ensures only the necessary bundle is loaded initially, significantly improving the perceived startup performance (Time To Interactive).
*   **Type Checking:** Configure ESLint and TypeScript aggressively to catch type errors during development, moving them from runtime bugs to compile-time warnings.

***

*this content was created by AI, but the coding and underlying logic are not.*