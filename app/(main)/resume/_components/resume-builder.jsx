'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, Download, Loader2, Monitor, Save, Scale } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resumeSchema } from '@/app/lib/schema'
import useFetch from '@/hooks/use-fetch'
import { saveResume } from '@/actions/resume'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import EntryForm from './entry-form'
import { Edit } from 'lucide-react'
import { entriesToMarkDown } from '@/app/lib/helper'
import MDEditor from '@uiw/react-md-editor'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
//import html2pdf from 'html2pdf.js'

const ResumeBuilder = ({ intialContent }) => {

    const [activeTab, setActiveTab] = useState('edit');
    const [resumeMode, setResumeMode] = useState('preview');
    const [previewContent, setPreviewContent] = useState(intialContent);
    const { user } = useUser();
    const [isGenerating, setIsGenerating] = useState(false)

    const { control, register, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            contactInfo: {},
            summary: '',
            skills: '',
            experience: [], // Ensure default empty array
            education: [],
            projects: []
        }
    });

    const {
        loading: isSaving,
        fn: saveResumeFn,
        data: saveResult,
        error: saveError
    } = useFetch(saveResume);

    const formValues = watch();

    useEffect(() => {
        if (intialContent) setActiveTab('preview');
    }, [intialContent]);



    useEffect(() => {
        if (activeTab === 'edit') {
            const newContent = getCombinedContent();
            setPreviewContent(newContent ? newContent : intialContent);
        }
    }, [formValues, activeTab]); // Ensure formValues triggers re-render



    const getContactMarkDown = () => {
        const { contactInfo } = formValues;
        const parts = [];
        if (contactInfo.email) parts.push(`${contactInfo.email}`);
        if (contactInfo.mobile) parts.push(`${contactInfo.mobile}`);
        if (contactInfo.linkedin) parts.push(`[LinkedIn](${contactInfo.linkedin}`);
        if (contactInfo.twitter) parts.push(`[Twitter](${contactInfo.twitter}`);

        return parts.length > 0
            ? `## <div align='center'>${user.fullName}</div>
            \n\n<div align='center'>\n\n${parts.join(" | ")}\n\n</div>`
            : "";
    }

    const getCombinedContent = () => {

        const { summary, skills, experience, education, projects } = formValues;

        return [
            getContactMarkDown(),
            summary && `## Professionals Summary\n\n${summary}`,
            skills && `## Skills\n\n${skills}`,
            entriesToMarkDown(experience, "Work Experience"),
            entriesToMarkDown(education, "Education"),
            entriesToMarkDown(projects, "Projects")
        ]
            .filter(Boolean)
            .join("\n\n")
    }


    useEffect(() => {
        if (saveResult && !isSaving) {
            toast.success("Resume saved Succesfully!");
        }

        if (saveError) {
            toast.error(saveError.message || "Failed To Save Resume")
        }
    }, [saveResult, saveError, isSaving]);

    

    const onSubmit = async () => {
        try {
            await saveResumeFn(previewContent);
        } catch (error) {
            console.error("Save Error:", error)
        }
    }

    const generatePDF = async () => {
        setIsGenerating(true);

        try {
            const html2pdf = (await import("html2pdf.js")).default; // Import dynamically
            const element = document.getElementById('resume-pdf');
            const opt = {
                margin: [15, 15],
                filename: 'resume.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: "a4", orientation: 'portrait' },
            };
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF Generation Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex flex-col md:flex-row justify-between items-center gap-2'>
                <h1 className='font-bold gradient-title text-5xl md:text-6xl'>Resume Builder</h1>
                <div className='space-x-2'>
                    <Button variant='destructive' onClick={handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                SAving...
                            </>
                        ) : (
                            <>
                                <Save className='h-4 w-4' />
                                Save
                            </>
                        )}

                    </Button>
                    <Button onClick={generatePDF} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                Generating PDF...
                            </>

                        ) : (
                            <>
                                <Download className='h-4 w-4' />
                                Download PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="edit">Form</TabsTrigger>
                    <TabsTrigger value="preview">MarkDown</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                    <form className='space-y-8'>
                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Contact Information</h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50'>
                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>Email</label>
                                    <Input
                                        {...register('contactInfo.email')}
                                        type='email'
                                        placeholder='your@email.com'
                                        error={errors.contactInfo?.email}
                                    />

                                    {errors.contactInfo?.email && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>Mobile Number</label>
                                    <Input
                                        {...register('contactInfo.mobile')}
                                        type='tel'
                                        placeholder='+91 234 567 890'
                                    />

                                    {errors.contactInfo?.mobile && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.mobile.message}
                                        </p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>LinkedIn URL</label>
                                    <Input
                                        {...register('contactInfo.linkedin')}
                                        type='url'
                                        placeholder='https://linkedin.com/in/your-profile'
                                    />

                                    {errors.contactInfo?.linkedin && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.linkedin.message}
                                        </p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>Twitter/X Profile</label>
                                    <Input
                                        {...register('contactInfo.twitter')}
                                        type='url'
                                        placeholder='https://twitter.com/your-handle'
                                    />

                                    {errors.contactInfo?.twitter && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.twitter.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Professional Summary</h3>
                            <Controller
                                name='summary'
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className='h-32'
                                        placeholder='Write a compelling professional summary...'
                                        error={errors.summary}
                                    />
                                )}
                            />
                            {errors.summary && (
                                <p className='text-sm text-red-500'>
                                    {errors.summary.message}
                                </p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Skills</h3>
                            <Controller
                                name='skills'
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className='h-32'
                                        placeholder='List your key skills...'
                                        error={errors.skills}
                                    />
                                )}
                            />
                            {errors.skills && (
                                <p className='text-sm text-red-500'>
                                    {errors.skills.message}
                                </p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Work Experience</h3>
                            <Controller
                                name='experience'
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type='Experience'
                                        entries={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.experience && (
                                <p className='text-sm text-red-500'>
                                    {errors.experience.message}
                                </p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Education</h3>
                            <Controller
                                name='education'
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type='Education'
                                        entries={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.education && (
                                <p className='text-sm text-red-500'>
                                    {errors.education.message}
                                </p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Projects</h3>
                            <Controller
                                name='projects'
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type='Project'
                                        entries={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.projects && (
                                <p className='text-sm text-red-500'>
                                    {errors.projects.message}
                                </p>
                            )}
                        </div>
                    </form>
                </TabsContent>
                <TabsContent value="preview">
                    <Button variant='link' type='button' className='mb-2' onClick={() => setResumeMode(resumeMode === 'preview' ? "edit" : 'preview')}>
                        {resumeMode === 'preview' ? (
                            <>
                                <Edit className='h-4 w-4' />
                                Edit Resume
                            </>
                        ) : (
                            <>
                                <Monitor className='h-4 w-4' />
                                Show Preview
                            </>
                        )

                        }
                    </Button>

                    {resumeMode !== 'preview' && (
                        <div className='flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2'>
                            <AlertTriangle className='h-5 w-5' />
                            <span className='text-sm'>
                                you will lose editied markdown if you update the form data
                            </span>
                        </div>
                    )}

                    <div className='border rounded-lg'>
                        <MDEditor

                            value={previewContent} onChange={setPreviewContent} height={800} preview={resumeMode}

                        />
                    </div>

                    <div className='hidden'>
                        <div className='resume-pdf'>
                            <MDEditor.Markdown
                                source={previewContent}
                                style={{
                                    background: 'white',
                                    color: 'black'
                                }}
                            />
                        </div>
                    </div>

                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ResumeBuilder