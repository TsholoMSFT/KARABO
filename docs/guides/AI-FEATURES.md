# AI Integration Documentation

## Overview

The Microsoft Innovation Hub Use Case Assessment application now features comprehensive AI capabilities powered by OpenAI's GPT-4o and GPT-4o-mini models. These AI features enhance the discovery process, use case generation, and executive summary creation to provide intelligent, context-aware assistance throughout the assessment workflow.

## AI Features

### 1. Live Discovery AI Insights (Real-time)

**Location**: Live Discovery Mode
**Model**: GPT-4o-mini
**Purpose**: Provide real-time analysis and opportunity identification during voice-based discovery sessions

#### How It Works
- Users answer discovery questions using voice input (speech-to-text)
- After providing an answer, users can click "Get AI Insight" button
- AI analyzes the current answer along with previous responses for context
- Generates 2-3 sentence actionable insight that:
  - Identifies key opportunities or challenges mentioned
  - Suggests potential areas to explore further
  - Connects to Microsoft innovation capabilities when relevant

#### User Experience
- Button appears after user provides an answer
- Shows "Analyzing..." state while generating
- Displays insight in a highlighted alert box with lightbulb icon
- Insight remains visible until user moves to next question
- Non-blocking - users can proceed without waiting for or requesting insights

#### Technical Implementation
```typescript
const promptText = `You are an innovation consultant providing real-time insights during a discovery session.

${contextText}Current Question: ${currentQuestion.question}
Current Answer: ${fullTranscript}

Industry Context: ${industryLabels[selectedIndustry]}

Provide a brief, actionable insight (2-3 sentences) that:
1. Identifies a key opportunity or challenge based on this answer
2. Suggests a potential area to explore further
3. Connects to Microsoft innovation or technology capabilities when relevant`

const insight = await window.llm(promptText, 'gpt-4o-mini')
```

### 2. Standard Discovery AI Suggestions (Question Help)

**Location**: Standard Discovery Mode (text-based)
**Model**: GPT-4o-mini
**Purpose**: Help users think through discovery questions by providing thoughtful prompts and examples

#### How It Works
- Users see "Need help?" button next to each question
- Clicking button triggers AI to generate thinking prompts
- AI considers:
  - The current question being asked
  - Previous answers for context
  - Customer's company and industry
- Returns 2-3 bullet points with:
  - Key areas to consider
  - Common challenges/opportunities
  - Industry-specific examples

#### User Experience
- Small, subtle button that doesn't distract from main workflow
- Shows "Thinking..." state during generation
- Displays suggestions in expandable alert box
- Suggestions help guide thinking without answering the question
- Can be dismissed and regenerated as needed

#### Technical Implementation
```typescript
const promptText = `You are an innovation consultant helping someone think through a discovery question.

${contextText}Current Question: ${currentQuestion.question}

Customer Context:
- Company: ${sessionMetadata.customerName}
- Industry: ${selectedIndustry ? industryLabels[selectedIndustry] : 'General'}

Provide 2-3 thoughtful prompts or examples (bullet points) to help them think about how to answer this question effectively.`

const suggestion = await window.llm(promptText, 'gpt-4o-mini')
```

### 3. AI-Powered Use Case Generation

**Location**: Discovery Results Screen
**Model**: GPT-4o (primary model for higher quality)
**Purpose**: Automatically generate relevant, actionable use cases based on discovery session responses

#### How It Works
- Triggered automatically after discovery session completes
- AI analyzes all Q&A pairs from the session
- Considers customer context:
  - Customer name
  - Industry type
  - Innovation Hub location
  - Specific pain points and goals mentioned
- Generates 5-8 high-value use cases

#### Generated Use Case Structure
Each use case includes:
- **Title**: Clear, actionable (max 60 characters)
- **Description**: Detailed explanation of opportunity and potential solution (2-3 sentences)
- **Rationale**: Brief explanation linking to their specific responses (1 sentence)

#### User Experience
- Shows animated loading state with rotating sparkle icon
- Displays "Analyzing Your Responses" message
- Takes 5-15 seconds depending on response complexity
- Success toast notification shows count of generated use cases
- Results feed directly into scoring workflow

#### Technical Implementation
```typescript
const useCasesPromptText = `You are an innovation consultant at Microsoft helping identify potential use cases for Microsoft technologies and AI solutions.

DISCOVERY SESSION CONTEXT:
Customer: ${session.customerName}
Industry: ${session.industry ? industryLabels[session.industry] : 'General'}
Location: ${session.innovationHubLocation}

DISCOVERY RESPONSES:
${responsesText}${industryContext}

TASK: Analyze the responses and suggest 5-8 high-value use cases that could benefit from AI, automation, or digital transformation using Microsoft technologies.

GUIDELINES:
- Focus on practical, implementable solutions that address their stated challenges
- Consider Azure AI, Microsoft 365 Copilot, Power Platform, Azure OpenAI Service, and other Microsoft innovations
- Prioritize use cases with clear business value and feasibility
- Ensure diversity in the types of solutions`

const useCasesResult = await window.llm(useCasesPromptText, 'gpt-4o', true)
```

### 4. AI-Generated Executive Summary

**Location**: End of Discovery Workflow
**Model**: GPT-4o (primary model for professional quality)
**Purpose**: Create comprehensive executive summary suitable for leadership presentations

#### How It Works
- Generated after all use cases have been scored (Impact/Feasibility and RICE)
- AI receives:
  - Session metadata (customer, industry, location, stakeholders)
  - All scored use cases with their complete scoring data
  - Calculated scores for both methodologies
- Creates professional 3-4 paragraph summary

#### Summary Structure
1. **Opening** - Context about discovery session and strategic objectives
2. **Key Findings** - Most significant challenges, opportunities, and insights
3. **Recommendations** - Prioritized use cases with score references
4. **Next Steps** - Strategic actions and implementation approach

#### User Experience
- Shows "Generating Summary" loading screen with pulsing animation
- Professional output suitable for executive stakeholders
- Displays with prominent AI attribution badges
- Read-only but persistently saved with session
- Appears on dashboard when session is selected
- Enhanced visual design with gradient background and animated sparkle icon

#### Technical Implementation
```typescript
const summaryPromptText = `You are a senior innovation consultant at Microsoft creating an executive summary for a discovery session.

SESSION DETAILS:
Customer: ${session.customerName}
Industry: ${session.industry ? industryLabels[session.industry] : 'General'}
Session Name: ${session.name}
Innovation Hub Location: ${session.innovationHubLocation}
Solution Engineer: ${session.solutionEngineer}
Primary Stakeholder: ${session.primaryStakeholder}

USE CASES IDENTIFIED AND SCORED:
${useCasesList}

TASK: Create a compelling executive summary (3-4 well-structured paragraphs) that:
1. OPENING - Provide context about the discovery session and the customer's strategic objectives
2. KEY FINDINGS - Summarize the most significant business challenges, opportunities, and insights discovered
3. RECOMMENDATIONS - Highlight the prioritized use cases and their potential business impact (reference specific scores where relevant)
4. NEXT STEPS - Suggest strategic actions and implementation approach`

const summary = await window.llm(summaryPromptText, 'gpt-4o')
```

## AI Model Selection Strategy

### GPT-4o-mini
**Used for**: Real-time insights and suggestions during discovery
**Rationale**: 
- Faster response times for interactive features
- Lower latency for better user experience
- Sufficient quality for conversational assistance
- Cost-effective for frequent, smaller requests

### GPT-4o
**Used for**: Use case generation and executive summaries
**Rationale**:
- Higher quality output for critical deliverables
- Better understanding of complex business contexts
- More sophisticated reasoning for strategic recommendations
- Professional-grade writing suitable for executive audiences

## Error Handling & Fallbacks

### Graceful Degradation
- All AI features are optional enhancements
- Core workflow functions without AI
- Clear error messages if AI services unavailable
- Manual use case creation always available as fallback

### Specific Error Scenarios

**Use Case Generation Failure**:
- Shows error toast with retry option
- Allows user to manually add use cases
- Does not block workflow progression

**Executive Summary Failure**:
- Generates professional fallback summary with session details
- Displays warning toast about AI service issue
- Fallback includes all key metadata and use case counts
- Session still saves successfully

**Live Insight/Suggestion Failure**:
- Shows error toast notification
- User can continue without insights
- Button remains available for retry
- Does not interrupt voice recording or question progression

## Privacy & Data Considerations

### Data Sent to AI
- Discovery question responses (user-provided text)
- Customer metadata (name, industry, location)
- Session metadata (names, dates, stakeholders)
- Use case descriptions and scores

### Data NOT Sent to AI
- User authentication information
- System-level technical data
- Personal identifiable information beyond what user explicitly provides

### AI Response Storage
- Use case suggestions stored in session data
- Executive summaries stored with discovery sessions
- Real-time insights not persisted (shown only during session)
- All stored data persists in browser localStorage

## Future Enhancement Opportunities

1. **Adaptive Follow-up Questions**: AI generates custom follow-up questions based on previous answers
2. **Editable Summaries**: Allow users to refine AI-generated summaries with AI assistance
3. **Confidence Scoring**: Show AI confidence levels for use case recommendations
4. **Comparative Analysis**: AI comparison of multiple discovery sessions to identify patterns
5. **Implementation Planning**: AI-generated implementation roadmaps for top use cases
6. **ROI Estimation**: AI-powered ROI calculations based on industry benchmarks

## Performance Metrics

**Typical Response Times**:
- Live Insights: 2-5 seconds
- Question Suggestions: 2-4 seconds
- Use Case Generation: 5-15 seconds (5-8 use cases)
- Executive Summary: 8-20 seconds

**API Usage**:
- Average discovery session: 3-5 AI calls
- Complete workflow (discovery → summary): 8-12 AI calls
- Model: Primarily GPT-4o for quality, GPT-4o-mini for speed

## Testing Recommendations

### Manual Testing Scenarios
1. **Live Discovery with Insights**: Complete full session requesting insights after each answer
2. **Standard Discovery with Help**: Use AI suggestions for multiple questions
3. **Use Case Generation**: Test with varying response lengths and detail levels
4. **Executive Summary Quality**: Review summaries for professional tone and accuracy
5. **Error Handling**: Test behavior when AI services are slow or unavailable
6. **Cross-browser**: Verify speech recognition and AI features across Chrome, Edge, Safari

### Edge Cases to Test
- Very short/minimal discovery responses
- Skipping most questions
- Requesting insights multiple times on same answer
- Rapid mode switching during discovery
- Multiple discovery sessions in quick succession
