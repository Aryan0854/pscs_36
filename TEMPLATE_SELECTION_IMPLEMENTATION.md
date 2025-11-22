# Template Selection Implementation

## Overview
This document describes the implementation of automatic template selection for audio generation based on news content. The system now automatically selects from 8 different transcript templates based on the content type and context.

## Implemented Templates

1. **Panel Roundtable** - Formal, moderated discussion with expert takes and policy focus
2. **Rapid Q&A** - Punchy, factual interview format with quick questions and answers
3. **Expert Roundup** - Multiple short takes from different experts (newsletter style)
4. **Live Briefing** - Newsroom-style real-time updates with numbered points
5. **Social Media Thread** - Concise, sharable thread with facts and links
6. **Vox Pop** - Human voices with resident quotes and on-the-ground perspectives
7. **Investigative Timeline** - Factual chronology showing events and causality
8. **Editorial Exchange** - Short debate between opposing perspectives

## Implementation Details

### Content Classification
The system analyzes the input text to classify the content type:
- Breaking news (urgent, latest, immediate)
- Investigative reports (investigation, expose, reveal)
- Policy announcements (policy, government, minister)
- Human interest stories (resident, family, community)
- Social media content (twitter, facebook, social, viral)
- Q&A format (ask, question, faq, explain)
- General news (default fallback)

### Template Selection Logic
Based on content type and number of personas:
- Breaking news: Live briefing (≤2 personas) or Panel roundtable (≥3 personas)
- Investigative: Investigative timeline (≤2 personas) or Panel roundtable (≥3 personas)
- Policy: Panel roundtable (≥3 personas) or Editorial exchange (2 personas)
- Human interest: Vox pop (≤2 personas) or Panel roundtable (≥3 personas)
- Social media: Social media thread
- Q&A: Rapid Q&A
- General news: Panel roundtable (default)

### Key Information Extraction
The system extracts key information from the text for template filling:
- Numbers and statistics
- Dates and timelines
- Names and locations
- Key phrases and context

## Integration Points
1. **Python Backend**: Modified `5(Audio)/process_file.py` to include template selection logic
2. **API Endpoint**: Updated `/api/audio/generate` to return template information
3. **Frontend**: Modified `components/gemini-generator.tsx` to display selected template

## Benefits
- Contextually appropriate conversation formats
- Automatic adaptation to content type
- Consistent persona utilization
- Enhanced realism in generated audio
- Better user experience through varied output formats