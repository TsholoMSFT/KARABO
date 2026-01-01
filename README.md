# Microsoft Innovation Hub Use Case Assessment Tool

A comprehensive web application for evaluating and prioritizing use cases using Impact vs. Feasibility analysis and RICE scoring methodology, powered by AI to streamline the discovery process.

## 🤖 AI-Powered Features

This application leverages **OpenAI's GPT-4o and GPT-4o-mini** models to provide intelligent assistance throughout the assessment workflow:

- **🎯 Real-Time Discovery Insights**: AI analyzes voice responses during Live Discovery and suggests opportunities
- **💡 Smart Question Assistance**: Get thoughtful prompts and examples for discovery questions
- **🚀 Automatic Use Case Generation**: AI generates 5-8 relevant use cases from your discovery session
- **📄 Executive Summaries**: Professional AI-generated summaries ready for leadership presentations

**See [AI-GUIDE.md](./AI-GUIDE.md) for a quick overview or [AI-FEATURES.md](./AI-FEATURES.md) for complete documentation.**

## Key Features

### Discovery Process
- **Guided Discovery Workflow**: Answer strategic questions about business goals, challenges, and technical context
- **Dual Input Modes**: 
  - Standard Mode (text input with AI suggestions)
  - Live Mode (voice input with real-time AI insights)
- **Seamless Mode Switching**: Switch between text and voice mid-session without losing progress
- **Industry-Specific Questions**: Tailored questions for Healthcare, Financial Services, Manufacturing, and more

### Use Case Assessment
- **Impact vs. Feasibility Scoring**: Quick visual prioritization on a 2x2 matrix
- **RICE Methodology**: Comprehensive scoring using Reach, Impact, Confidence, and Effort
- **Dual Scoring Views**: Switch between methodologies to compare different prioritization approaches
- **Top Recommendations**: Automatically identifies top 3-5 use cases based on selected scoring method

### Session Management
- **Multi-Customer Support**: Manage assessments for multiple customers
- **Session Comparison**: Compare discovery sessions side-by-side
- **Customer Metadata**: Track stakeholders, locations, and team members
- **Persistent Storage**: All data saved locally in your browser

### Export & Reporting
- **PDF Export**: Generate professional assessment reports with customer branding
- **Print-Friendly Views**: Optimized layouts for sharing and presentations
- **Executive Summaries**: AI-generated strategic overviews of discovery findings
- **Comprehensive Reports**: Include methodology explanations, scores, and recommendations

## Getting Started

1. **Start a Discovery Session**: Click "Start Discovery" from the landing page
2. **Enter Customer Information**: Provide customer name, location, and stakeholders
3. **Choose Discovery Mode**:
   - Standard Mode for typed responses (with AI help available)
   - Live Mode for voice-based sessions (with AI insights)
4. **Answer Questions**: Respond to guided questions about the customer's needs
5. **Review AI-Generated Use Cases**: AI analyzes your responses and suggests relevant use cases
6. **Score Use Cases**: Evaluate each use case using Impact/Feasibility and RICE scoring
7. **View Results**: AI generates an executive summary and displays prioritized recommendations
8. **Export & Share**: Generate PDF reports for stakeholder presentations

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui v4, Radix UI primitives
- **State Management**: React hooks with Spark KV API for persistence
- **AI Integration**: OpenAI GPT-4o and GPT-4o-mini via Spark SDK
- **Speech Recognition**: Web Speech API (Chrome, Edge, Safari)
- **Icons**: Phosphor Icons
- **Animations**: Framer Motion
- **Build Tool**: Vite

## Documentation

- **[PRD.md](./PRD.md)**: Complete product requirements and design specifications
- **[AI-GUIDE.md](./AI-GUIDE.md)**: Quick start guide for AI features
- **[AI-FEATURES.md](./AI-FEATURES.md)**: Comprehensive AI technical documentation

## Browser Compatibility

- **Recommended**: Chrome, Edge (best support for Live Discovery voice features)
- **Supported**: Safari, Firefox (Standard Discovery fully supported)
- **Note**: Live Discovery requires Web Speech API support

## Privacy & Data

- All data stored locally in your browser using Spark KV API
- AI features process only the information you explicitly provide
- No external databases or user authentication required
- Session data persists between browser sessions

## Development

This is a Spark application running on the GitHub Spark platform. All development and deployment is managed through the Spark environment.

📄 **License**

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
