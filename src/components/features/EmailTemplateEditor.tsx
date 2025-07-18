import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

interface EmailTemplate {
  id: number
  name: string
  description: string
  subject: string
  html_content: string
  variables: string[]
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface EmailTemplateEditorProps {
  isOpen: boolean
  onClose: () => void
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    html_content: '',
    variables: '',
    category: 'general',
    is_active: true
  })

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error loading templates:', error)
        toast.error('Failed to load email templates')
        return
      }

      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      html_content: template.html_content,
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      category: template.category,
      is_active: template.is_active
    })
    
    // Set up preview data with sample values
    const sampleData: Record<string, string> = {}
    if (Array.isArray(template.variables)) {
      template.variables.forEach(variable => {
        switch (variable) {
          case 'firstName':
            sampleData[variable] = 'Tyler'
            break
          case 'lastName':
            sampleData[variable] = 'Amos'
            break
          case 'email':
            sampleData[variable] = 'tyler@example.com'
            break
          case 'passwordSetupUrl':
            sampleData[variable] = 'https://linky.com/setup-password?token=sample'
            break
          default:
            sampleData[variable] = `Sample ${variable}`
        }
      })
    }
    setPreviewData(sampleData)
  }

  const startEditing = () => {
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    if (selectedTemplate) {
      selectTemplate(selectedTemplate)
    }
  }

  const saveTemplate = async () => {
    try {
      setLoading(true)
      
      const templateData = {
        ...formData,
        variables: formData.variables.split(',').map(v => v.trim()).filter(v => v)
      }

      let result
      if (selectedTemplate) {
        // Update existing template
        result = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id)
          .select()
      } else {
        // Create new template
        result = await supabase
          .from('email_templates')
          .insert([templateData])
          .select()
      }

      if (result.error) {
        console.error('Error saving template:', result.error)
        toast.error('Failed to save email template')
        return
      }

      toast.success(`Email template ${selectedTemplate ? 'updated' : 'created'} successfully!`)
      setIsEditing(false)
      loadTemplates()
      
      if (result.data && result.data[0]) {
        selectTemplate(result.data[0])
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save email template')
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', template.id)

      if (error) {
        console.error('Error deleting template:', error)
        toast.error('Failed to delete email template')
        return
      }

      toast.success('Email template deleted successfully!')
      loadTemplates()
      
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete email template')
    } finally {
      setLoading(false)
    }
  }

  const createNewTemplate = () => {
    setSelectedTemplate(null)
    setFormData({
      name: '',
      description: '',
      subject: '',
      html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Email Template</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hello {{firstName}}!</h1>
        </div>
        <div class="content">
            <p>Your content goes here...</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Linky Team</p>
        </div>
    </div>
</body>
</html>`,
      variables: 'firstName',
      category: 'general',
      is_active: true
    })
    setPreviewData({ firstName: 'Tyler' })
    setIsEditing(true)
  }

  const renderPreview = () => {
    if (!formData.html_content) return <div>No content to preview</div>

    let previewContent = formData.html_content
    
    // Replace variables with preview data
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      previewContent = previewContent.replace(regex, value)
    })

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 border-b">
          <p className="text-sm font-medium">Subject: {formData.subject}</p>
        </div>
        <div 
          className="h-96 overflow-auto bg-white"
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>📧 Email Template Manager</DialogTitle>
          <DialogDescription>
            Create and edit email templates with live preview
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Template List */}
          <div className="w-1/3 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Templates</h3>
              <Button onClick={createNewTemplate} size="sm">
                + New Template
              </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-2">
              {loading && templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates found. Create your first template!
                </div>
              ) : (
                templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => selectTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {template.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            {!template.is_active && (
                              <Badge variant="destructive" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTemplate(template)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Editor/Preview */}
          <div className="flex-1 flex flex-col">
            {selectedTemplate || isEditing ? (
              <Tabs defaultValue="edit" className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="edit">✏️ Edit</TabsTrigger>
                    <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={cancelEditing}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={saveTemplate}
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Template'}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={startEditing}>
                        ✏️ Edit Template
                      </Button>
                    )}
                  </div>
                </div>

                <TabsContent value="edit" className="flex-1 overflow-auto">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!isEditing}
                          placeholder="e.g., welcome_email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="onboarding">Onboarding</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Brief description of this template"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Welcome to {{companyName}}!"
                      />
                    </div>

                    <div>
                      <Label htmlFor="variables">Variables (comma-separated)</Label>
                      <Input
                        id="variables"
                        value={formData.variables}
                        onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                        disabled={!isEditing}
                        placeholder="firstName, lastName, email, passwordSetupUrl"
                      />
                                             <p className="text-xs text-gray-500 mt-1">
                         Use these variables in your template as {`{{variableName}}`}
                       </p>
                    </div>

                    <div>
                      <Label htmlFor="html_content">HTML Content</Label>
                      <Textarea
                        id="html_content"
                        value={formData.html_content}
                        onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                        disabled={!isEditing}
                        className="font-mono text-sm h-64"
                        placeholder="<!DOCTYPE html>..."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 overflow-auto">
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Preview Variables</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.variables.split(',').map(variable => {
                          const trimmed = variable.trim()
                          if (!trimmed) return null
                          return (
                            <div key={trimmed} className="flex items-center gap-2">
                              <Label className="text-xs">{trimmed}:</Label>
                                                             <Input
                                 value={previewData[trimmed] || ''}
                                 onChange={(e) => setPreviewData({ 
                                   ...previewData, 
                                   [trimmed]: e.target.value 
                                 })}
                                 placeholder={`Sample ${trimmed}`}
                                 className="text-xs h-8"
                               />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {renderPreview()}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">📧 Select a template to edit</p>
                  <p className="text-sm">Choose a template from the list or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 