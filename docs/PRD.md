# Planning Guide

**Author:** Tsholo K. Setati  
**Project:** ID-8 (Microsoft Innovation Hub Enterprise Discovery)

I designed this strategic prioritization tool to help product teams evaluate and rank use cases using Impact vs. Feasibility analysis and RICE scoring methodology to identify the top 3-5 highest-value opportunities.

**Experience Qualities I'm Aiming For**:
1. **Analytical** - The interface should feel data-driven and methodical, instilling confidence in the prioritization decisions through clear visualizations and structured scoring.
2. **Efficient** - Users should move quickly through evaluating multiple use cases without friction, with smart defaults and intuitive input patterns that respect their time.
3. **Insightful** - The app should reveal patterns and make recommendations visible through dynamic visualizations, helping users see the "why" behind the top-ranked use cases at a glance.

**Complexity Level**: Light Application (multiple features with basic state)
I built this app to manage multiple use cases with structured scoring data, visualizations, and persistent state, plus an AI-powered discovery process to help identify use cases. It doesn't require advanced features like authentication, real-time collaboration, or complex workflows.

## Essential Features

### Use Case Discovery Process
- **Functionality**: Guided questionnaire-based workflow that helps identify potential use cases through strategic questions about business goals, challenges, users, and technical context; uses **AI (GPT-4o and GPT-4o-mini)** to analyze responses and suggest relevant use cases; automatically generates an **AI-powered executive summary** at the end of the discovery session; supports both Standard (typed) and Live (voice) modes with ability to switch between modes mid-session while preserving all answers; **Live mode includes real-time AI insights** that analyze responses and suggest areas to explore further
- **Purpose**: Lower the barrier to entry for customers who are unsure what use cases to assess; systematically uncover opportunities by asking the right questions; provide strategic context and insights through AI-generated executive summaries; offer flexibility for users to choose their preferred input method; **provide intelligent, context-aware assistance during discovery**
- **Trigger**: User clicks "Start Discovery" button from the dashboard for Standard mode, or "Live Discovery" button for voice-enabled mode
- **Progression**: Click Start Discovery → Enter customer information (name, location, stakeholders) → Choose session name → Select industry → Answer 8 guided questions (business, technical, users, challenges) in Standard (typing with optional AI help) or Live (voice with AI insights) mode → **In Standard mode: Click "Need help?" to get AI suggestions for thoughtful question prompts** → **In Live mode: Click "Get AI Insight" after answering to receive real-time analysis and opportunity identification** → Switch between modes at any time by clicking "Switch to Live" or "Switch to Standard" button, preserving all answers → **AI (GPT-4o) analyzes all responses considering industry context and generates 5-8 tailored use cases** → **AI (GPT-4o) generates comprehensive executive summary (3-4 paragraphs) covering strategic objectives, key findings, recommendations with score references, and next steps** → Review AI-suggested use cases with rationales → Add/remove use cases → Select use cases for scoring workflow → Score Impact/Feasibility → Score RICE → AI generates and displays executive summary → Use cases appear in main dashboard ready for prioritization → Executive summary appears on dashboard for the session
- **Success criteria**: All questions are optional and can be skipped; progress indicator shows completion; users can seamlessly switch between Standard and Live modes at any step without losing progress; answers persist when switching modes; in Live mode, speech is captured and transcribed in real-time; users can manually edit voice transcriptions; **AI suggestions help users think through questions without answering for them**; **AI insights in Live mode identify opportunities and suggest exploration areas based on context**; **AI generates 5-8 relevant, actionable use cases specifically tailored to customer's industry and responses**; **AI generates professional executive summary suitable for executive leadership with quantitative score references**; suggested use cases include title, description, and rationale tied to their responses; user can select/deselect suggestions before adding; selected use cases integrate seamlessly into the main assessment workflow; executive summary is displayed with prominent AI attribution on dashboard; can cancel at any time and return to dashboard

### Use Case Management
- **Functionality**: Add, edit, and delete use cases with title and description
- **Purpose**: Maintain a dynamic list of opportunities to evaluate
- **Trigger**: User clicks "Add Use Case" button or edits existing entries
- **Progression**: Click Add → Enter title/description in dialog → Save → Use case appears in list with default scores
- **Success criteria**: Use cases persist between sessions, can be edited inline, and deleted with confirmation

### Impact vs. Feasibility Scoring
- **Functionality**: Score each use case on Impact (1-10) and Feasibility (1-10) scales
- **Purpose**: Quickly assess strategic value against implementation difficulty
- **Trigger**: User adjusts sliders or inputs for Impact and Feasibility on each use case
- **Progression**: Select use case → Adjust Impact slider → Adjust Feasibility slider → See position update on matrix visualization
- **Success criteria**: Scores save automatically, matrix updates in real-time, visual quadrant position reflects scores

### RICE Scoring
- **Functionality**: Evaluate use cases using Reach, Impact, Confidence, and Effort dimensions with toggleable detailed explanations
- **Purpose**: Provide a comprehensive, weighted scoring methodology for rigorous prioritization with clear, on-demand guidance on what each metric means
- **Trigger**: User toggles to RICE view and inputs values for each dimension; clicks header to expand/collapse detailed explanation panel
- **Progression**: Switch to RICE tab → Click to expand RICE explanation panel → Read detailed descriptions for each component → Enter Reach (number of users) → Rate Impact (0.25-3, with severity descriptions) → Set Confidence (%) → Estimate Effort (person-weeks) → See calculated RICE score → Click to collapse explanation when done
- **Success criteria**: RICE score auto-calculates as (Reach × Impact × Confidence) / Effort, updates rankings dynamically, collapsible explanation panel provides comprehensive guidance for each metric with smooth expand/collapse animation

### RICE Component Tooltips
- **Functionality**: Display helpful explanations for Reach, Impact Multiplier, Confidence, and Effort when users hover over info icons
- **Purpose**: Educate users on how to properly assess each RICE dimension and ensure consistent evaluation across use cases
- **Trigger**: User hovers over info icon next to each RICE field label
- **Progression**: Hover over info icon → View detailed tooltip → Understand metric → Enter informed value
- **Success criteria**: Tooltips clearly explain: Reach (users affected per period), Impact Multiplier (3x=Massive to 0.25x=Minimal with descriptions), Confidence (estimation certainty %), Effort (person-weeks with conversion examples)

### Visual Prioritization Matrix
- **Functionality**: Display use cases on a 2×2 matrix (Impact vs. Feasibility) with quadrant labels and both X-axis (Feasibility) and Y-axis (Impact) labels clearly visible; includes toggleable comprehensive quadrant descriptions
- **Purpose**: Provide instant visual understanding of which use cases fall into "Quick Wins," "Strategic Bets," etc., with detailed quadrant explanations available on demand
- **Trigger**: Automatically updates as scores change; user clicks to toggle quadrant description visibility
- **Progression**: View matrix → Identify clustering → Hover for details → Click to expand quadrant descriptions → Read detailed strategic meaning for each quadrant → Click to collapse when done
- **Success criteria**: Use cases plotted accurately, both axes clearly labeled, quadrants clearly labeled (Quick Wins, Strategic, Fill-ins, Time Sinks), hover states show full details, collapsible quadrant descriptions explain each area's strategic meaning in detail with smooth expand/collapse animation

### Top Recommendations
- **Functionality**: Automatically identify and highlight top 3-5 use cases based on selected methodology
- **Purpose**: Give clear direction on where to focus efforts
- **Trigger**: Rankings update automatically as scores change
- **Progression**: Score use cases → View ranked list → Top 3-5 highlighted with visual distinction → View printer-friendly report
- **Success criteria**: Rankings update in real-time, top picks clearly distinguished visually, can toggle between Impact/Feasibility and RICE rankings

### Export & Print Capabilities
- **Functionality**: Generate downloadable PDF documents and printer-friendly reports showing all use cases, top recommendations, customer metadata, executive summary, methodology explanation (RICE or Impact/Feasibility quadrants), and configurable effort unit display with proper page break handling
- **Purpose**: Create shareable documentation for stakeholder presentations, team alignment, and executive reviews without content clipping or overlap
- **Trigger**: User clicks "Export" button and selects effort unit preference (person-weeks, FTE, or man-hours), then chooses "Download PDF" or "Print View"
- **Progression**: Click Export → Select effort unit display → Choose Download PDF or Print View → PDF generates with customer info, executive summary, methodology explanations, and all use cases → Save file or use browser print function
- **Success criteria**: 
  - PDF export includes: Cover page with title and metadata, customer information section, executive summary, detailed scoring methodology explanation (RICE components or quadrant descriptions with strategic guidance), top recommendations highlighted with rank badges, all use cases with scores and KPIs
  - Print view provides browser-based print preview with same content
  - Report has proper page breaks preventing content clipping, no overlapping elements
  - Effort displayed in selected unit (person-weeks default, FTE as years, man-hours as total hours)
  - KPI labels displayed for each use case with proper formatting
  - PDF filename includes "microsoft-innovation-hub-assessment" prefix with timestamp
  - Success toast notification confirms PDF download

## Edge Case Handling
- **Empty State**: Show welcoming onboarding with example use case and clear CTA to add first entry; prominently feature Discovery process as primary starting point when no sessions exist
- **Discovery with minimal responses**: AI generates use cases and executive summary even if some questions are skipped, focusing on provided information; **AI adjusts recommendations based on available context**
- **Discovery API failure**: Show error message with retry option for both use cases and executive summary generation; allow manual use case creation as fallback; **graceful degradation with fallback summary if AI service unavailable**
- **AI insight generation failure**: Display user-friendly error message; allow users to continue without insights; **session remains functional without AI assistance**
- **No use cases selected from discovery**: Prevent proceeding until at least one use case is selected
- **Mode switching preserves answers**: When switching between Standard and Live modes mid-session, all previously answered questions remain intact and accessible
- **Live mode speech recognition unavailable**: Display clear error message if browser doesn't support Web Speech API; offer option to switch to Standard mode
- **Live mode with manual editing**: Users can manually type or edit voice transcriptions in Live mode for corrections
- **AI insight rate limiting**: Show appropriate message if too many AI requests made in short time; **queue requests gracefully**
- **Executive summary display**: Executive summary is read-only and only appears when a session with an executive summary is selected; if no executive summary exists for a session, the section is hidden; **prominently displays AI attribution badge**
- **Tie Scores**: When use cases have identical scores, maintain stable sort order using creation timestamp
- **Incomplete RICE Data**: Display placeholder or "Incomplete" badge when required RICE fields are missing
- **Zero Effort in RICE**: Prevent division by zero by requiring minimum effort value of 0.1
- **Large Data Sets**: Gracefully handle 20+ use cases with scrolling and maintain visualization performance

## Design Direction
I want the design to evoke precision, clarity, and strategic intelligence - like a command center for product decisions. The interface should feel modern and data-forward, with confidence-inspiring visualizations that make complex prioritization feel approachable and actionable.

## Color Selection
I chose a professional palette inspired by Microsoft Innovation Hub that balances analytical credibility with approachable warmth and clarity.

- **Primary Color**: Microsoft Blue `oklch(0.45 0.13 265)` - Communicates innovation, intelligence, and trustworthiness; used for primary actions and key data points
- **Secondary Colors**: 
  - Teal accent `oklch(0.52 0.18 195)` for highlighting high-value opportunities and secondary UI elements
  - Light gray `oklch(0.96 0.005 240)` for cards and containers
- **Accent Color**: Warm gold `oklch(0.62 0.20 45)` - Attention-grabbing for top recommendations, CTAs, and highlighting "Quick Win" quadrant
- **Foreground/Background Pairings**:
  - Primary (Microsoft Blue `oklch(0.45 0.13 265)`): White text `oklch(0.99 0 0)` - Ratio 8.5:1 ✓
  - Accent (Warm Gold `oklch(0.62 0.20 45)`): Dark text `oklch(0.20 0.01 240)` - Ratio 5.8:1 ✓
  - Background (Clean white `oklch(0.99 0.005 240)`): Dark text `oklch(0.20 0.01 240)` - Ratio 14.2:1 ✓
  - Muted (Light gray `oklch(0.96 0.005 240)`): Medium text `oklch(0.48 0.01 240)` - Ratio 4.9:1 ✓

## Font Selection
I selected typography that communicates analytical precision while remaining approachable - a balance between technical credibility and human-centered design.

- **Primary Font**: Space Grotesk - A geometric sans with technical character that feels modern and precise, perfect for data-driven interfaces
- **Secondary Font**: Inter - For body text and form inputs, providing exceptional readability and a neutral, professional foundation

- **Typographic Hierarchy**:
  - H1 (Page Title): Space Grotesk Bold / 32px / tight letter-spacing (-0.02em)
  - H2 (Section Headers): Space Grotesk SemiBold / 24px / normal
  - H3 (Use Case Titles): Space Grotesk Medium / 18px / normal
  - Body (Descriptions): Inter Regular / 15px / line-height 1.6
  - Labels (Form Fields): Inter Medium / 13px / uppercase / letter-spacing 0.05em
  - Data Values (Scores): Space Grotesk SemiBold / 20px / tabular-nums

## Animations
I designed animations to reinforce the sense of intelligent, responsive analysis - smooth transitions that make data changes feel connected and purposeful, with subtle celebrations for insights discovered.

I use animations to:
- Smooth transitions when use cases move on the matrix (spring physics, 400ms)
- Gentle scale and highlight effect when a use case enters the top 3-5 (scale 1.02, glow effect)
- Subtle number counting animation when RICE scores recalculate (200ms ease-out)
- Micro-interaction feedback on score adjustments (haptic-feeling slider movement)
- Delightful confetti or particle effect when first use case is added or top recommendation changes
- Fade and slide transitions between Impact/Feasibility and RICE views (300ms ease-in-out)
- Discovery wizard: Question transitions slide in from right, fade out to left when going back (300ms)
- Discovery mode switching: Smooth transition animation when switching between Standard and Live modes (300ms fade)
- Discovery results: Staggered fade-in for suggested use cases (100ms delay between each)
- Loading spinner with rotating sparkle icon while AI generates use cases
- Smooth expand/collapse for discovery launcher card details
- Live mode: Pulsing microphone icon when recording active

## Component Selection

- **Components**:
  - `Dialog` - For adding/editing use cases with form inputs and configuring print view options
  - `Card` - For each use case in list view with elevated, interactive feel; also for discovery launcher and question containers
  - `Slider` - For Impact, Feasibility, and RICE dimension inputs with custom styling
  - `Input` - For use case titles, Reach, and Effort numeric values
  - `Textarea` - For use case descriptions and discovery question responses
  - `Tabs` - To switch between Impact/Feasibility and RICE scoring methodologies
  - `Badge` - To highlight top 3-5 recommendations with rank numbers; also for discovery question categories
  - `Button` - Primary actions with distinct hierarchy (Add, Save, Delete, Print View, Start Discovery, Next/Back)
  - `Select` - For RICE Impact multiplier dropdown (0.25x, 0.5x, 1x, 2x, 3x)
  - `Tooltip` - For RICE component descriptions (Reach, Impact, Confidence, Effort)
  - `RadioGroup` - For selecting effort unit display in print view (person-weeks, FTE, man-hours)
  - `Alert` - For empty states and confirmation dialogs
  - `Separator` - To divide sections visually
  - `Scroll Area` - For use case list and discovery results when exceeding viewport height
  - `Progress` - Linear progress bar showing discovery wizard completion percentage
  - `Checkbox` - For selecting suggested use cases in discovery results
  - Collapsible panels - For toggleable methodology descriptions (RICE and Impact/Feasibility quadrants)

- **Customizations**:
  - Custom 2×2 matrix visualization component using SVG with interactive plotted points and both X and Y axis labels
  - Collapsible quadrant description panel below matrix with expand/collapse animation explaining strategic meaning of each quadrant
  - Collapsible RICE methodology explanation panel with expand/collapse animation on the main dashboard
  - Custom RICE score calculator display with animated number transitions
  - Top recommendations panel with gradient background and rank indicators
  - Score input components with live preview of impact on ranking
  - Print view component with printer-optimized layout, proper page breaks, and methodology explanations (RICE or quadrants)
  - Toggle buttons with caret icons to show/hide description panels
  - Discovery wizard full-screen overlay with centered card layout
  - Discovery results page with AI-generated use case cards featuring selection checkboxes
  - Discovery launcher card with gradient background and step-by-step process visualization

- **States**:
  - Buttons: Distinct pressed state with slight inset shadow, hover lifts with subtle shadow
  - Cards: Elevated shadow on hover, selected state with accent border for top recommendations
  - Sliders: Track fills with gradient showing score quality (red→yellow→green), thumb enlarges on hover
  - Inputs: Focused state with accent glow and slight scale, error states with shake animation
  - Matrix points: Hover enlarges and shows tooltip with full details, selected state persists highlight

- **Icon Selection**:
  - `Plus` - Add new use case
  - `PencilSimple` - Edit use case
  - `Trash` - Delete use case
  - `Sparkle` - Mark top recommendations, AI-powered features, and AI-generated content
  - `ChartScatter` - Impact/Feasibility view icon
  - `ListNumbers` - RICE scoring view icon
  - `Printer` - Print view / export icon
  - `Info` - RICE component help tooltips
  - `X` - Close dialogs
  - `TrendUp` - High impact indicator
  - `Lightning` - Quick win marker
  - `CaretDown` / `CaretUp` - Toggle description panel visibility
  - `MagnifyingGlass` - Discovery process icon
  - `Lightbulb` - Use case suggestions and insights
  - `ArrowLeft` / `ArrowRight` - Navigation in discovery wizard
  - `ChartLine` - Prioritization and assessment indicators
  - `Microphone` / `MicrophoneSlash` - Live voice mode controls
  - `Keyboard` - Switch to Standard (typed) mode
  - `FileText` - Executive summary section
  - `FloppyDisk` - Saved session indicator

- **Spacing**:
  - Container padding: `p-6` (24px) on desktop, `p-4` (16px) on mobile
  - Card gaps: `gap-4` (16px) between cards in list
  - Form field spacing: `space-y-4` (16px) vertical rhythm
  - Section margins: `mb-8` (32px) between major sections
  - Matrix padding: `p-8` (32px) around visualization area

- **Mobile**:
  - Stack matrix visualization above use case list vertically
  - Single column card layout with full width
  - Tabs collapse to dropdown selector on narrow screens
  - Dialog forms adapt to full-screen on mobile with fixed action buttons at bottom
  - Reduce matrix size and make scrollable/zoomable on touch
  - Sticky top recommendations bar on mobile for quick reference
  - Discovery wizard optimized for mobile with full-screen overlay
  - Discovery launcher card stacks elements vertically on mobile with both Standard and Live Discovery buttons
  - Discovery results use single-column layout with touch-friendly checkboxes
  - Live mode interface optimized for mobile with large touch-friendly microphone controls
  - Mode switching buttons remain accessible on all screen sizes
