import { DiscoverySession } from '@/lib/types'
import { discoveryQuestions, getQuestionsForIndustry, industryLabels } from '@/lib/discovery-questions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Clock } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface SessionComparisonProps {
  sessions: DiscoverySession[]
  onBack: () => void
}

export function SessionComparison({ sessions, onBack }: SessionComparisonProps) {
  const getResponseForQuestion = (session: DiscoverySession, questionId: string): string => {
    const response = session.responses.find((r) => r.questionId === questionId)
    return response?.answer || 'No response'
  }

  const getAllQuestionIds = (): string[] => {
    const questionIds = new Set<string>()
    sessions.forEach((session) => {
      session.responses.forEach((r) => questionIds.add(r.questionId))
    })
    return Array.from(questionIds)
  }

  const getQuestionById = (questionId: string) => {
    for (const session of sessions) {
      const industry = session.industry || 'general'
      const questions = industry !== 'general' 
        ? getQuestionsForIndustry(industry)
        : discoveryQuestions.filter((q) => !q.industries)
      
      const question = questions.find((q) => q.id === questionId)
      if (question) return question
    }
    return null
  }

  const allQuestionIds = getAllQuestionIds()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Session Comparison</h1>
              <p className="text-muted-foreground">
                Compare responses and insights across {sessions.length} discovery sessions
              </p>
            </div>
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft size={18} />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{session.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {session.industry && (
                      <Badge variant="outline" className="text-xs">
                        {industryLabels[session.industry]}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {format(session.createdAt, 'MMM d, yyyy')}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Response Comparison</CardTitle>
              <CardDescription>
                View how each session responded to the discovery questions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-6 space-y-6">
                  {allQuestionIds.map((questionId) => {
                    const question = getQuestionById(questionId)
                    if (!question) return null

                    return (
                      <div key={questionId} className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {question.category}
                            </Badge>
                            {question.industries && (
                              <Badge variant="outline" className="text-xs">
                                Industry-Specific
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-foreground leading-relaxed">
                            {question.question}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sessions.map((session) => {
                            const response = getResponseForQuestion(session, questionId)
                            const hasResponse = response !== 'No response'

                            return (
                              <Card
                                key={session.id}
                                className={`${
                                  hasResponse ? 'border-border' : 'border-dashed border-muted-foreground/30'
                                }`}
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {session.name}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <p
                                    className={`text-sm leading-relaxed ${
                                      hasResponse ? 'text-foreground' : 'text-muted-foreground italic'
                                    }`}
                                  >
                                    {response}
                                  </p>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>

                        <Separator className="mt-6" />
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {sessions.some((s) => s.suggestedUseCases && s.suggestedUseCases.length > 0) && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Suggested Use Cases</CardTitle>
                <CardDescription>
                  Use cases identified from each discovery session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((session) => (
                    <Card key={session.id} className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {session.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {session.suggestedUseCases && session.suggestedUseCases.length > 0 ? (
                          <div className="space-y-3">
                            {session.suggestedUseCases.map((useCase, index) => (
                              <div key={index} className="space-y-1">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {useCase.title}
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {useCase.description}
                                </p>
                                {index < session.suggestedUseCases!.length - 1 && (
                                  <Separator className="mt-3" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No use cases generated
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
