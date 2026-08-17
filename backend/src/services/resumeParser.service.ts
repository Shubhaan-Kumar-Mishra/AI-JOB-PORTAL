import { createRequire } from 'module';
import mammoth from 'mammoth';
import { ParsedResumeData, ParsedEducation, ParsedExperience, ParsedProject } from '../models/Resume.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extracts raw text from an in-memory PDF buffer.
 * Handles both pdf-parse v2 (PDFParse class) and v1 (legacy function).
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    if (pdfParse && typeof pdfParse.PDFParse === 'function') {
      const parser = new pdfParse.PDFParse({ data: buffer });
      const result = await parser.getText();
      return result && result.text ? result.text.trim() : '';
    } else if (typeof pdfParse === 'function') {
      const result = await pdfParse(buffer);
      return result && result.text ? result.text.trim() : '';
    }
    return '';
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF document: ${error.message || error}`);
  }
}

/**
 * Extracts raw text from an in-memory DOCX buffer.
 */
export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ? result.value.trim() : '';
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOCX document: ${error.message || error}`);
  }
}

/**
 * Deterministic heuristic parser for Stage 5.
 * Identifies contact metadata, summary, skills, education, experience, and projects using section headers and regular expressions.
 */
export function parseResumeText(rawText: string): ParsedResumeData {
  if (!rawText || rawText.length < 30) {
    throw new Error('Could not extract readable text from this file. Please upload a text-based PDF or DOCX resume.');
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Email Extraction
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;

  // 2. Phone Number Extraction
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) || rawText.match(/\+?91[-.\s]?[6-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : null;

  // 3. Candidate Name Extraction (First clean line at top of resume not matching email/phone/urls)
  let name: string | null = null;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (
      !line.includes('@') &&
      !line.match(/\d{5,}/) &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      !line.toLowerCase().includes('http') &&
      line.length > 2 &&
      line.length < 50
    ) {
      name = line.replace(/[^a-zA-Z\s.'-]/g, '').trim();
      if (name.length > 2) break;
    }
  }

  // 4. Location Extraction (Common Indian cities / regions or Location line)
  let location: string | null = null;
  const locationRegex = /(?:Location|Address|City):\s*([^\n]+)/i;
  const locMatch = rawText.match(locationRegex);
  if (locMatch) {
    location = locMatch[1].trim();
  } else {
    const commonCities = [
      'Delhi',
      'New Delhi',
      'Bengaluru',
      'Bangalore',
      'Mumbai',
      'Hyderabad',
      'Pune',
      'Chennai',
      'Noida',
      'Gurugram',
      'Gurgaon',
      'Kolkata',
      'Ahmedabad',
      'Jaipur',
      'Chandigarh',
      'Kochi',
    ];
    for (const city of commonCities) {
      if (new RegExp(`\\b${city}\\b`, 'i').test(rawText)) {
        location = `${city}, India`;
        break;
      }
    }
  }

  // Section Segmentation Map
  const sections = segmentResumeSections(rawText);

  // 5. Summary / Objective
  const summaryText = sections['summary'] || sections['profile'] || sections['objective'] || sections['about'] || null;
  const summary = summaryText ? summaryText.slice(0, 500).trim() : null;

  // 6. Skills Extraction
  const skillsText = sections['skills'] || sections['technical skills'] || sections['core competencies'] || sections['technologies'] || '';
  const skills = extractSkillsList(skillsText, rawText);

  // 7. Education Extraction
  const educationText = sections['education'] || sections['academic background'] || sections['qualifications'] || '';
  const education = parseEducationSection(educationText);

  // 8. Work Experience Extraction
  const expText = sections['experience'] || sections['work experience'] || sections['employment history'] || sections['work history'] || '';
  const experience = parseExperienceSection(expText);

  // 9. Projects Extraction
  const projText = sections['projects'] || sections['personal projects'] || sections['key projects'] || '';
  const projects = parseProjectsSection(projText);

  return {
    name,
    email,
    phone,
    location,
    summary,
    skills,
    education,
    experience,
    projects,
  };
}

/**
 * Segments raw text into mapped section headers.
 */
function segmentResumeSections(rawText: string): Record<string, string> {
  const lines = rawText.split('\n');
  const sections: Record<string, string> = {};
  let currentHeader: string | null = null;
  let currentLines: string[] = [];

  const knownHeaders = [
    'summary',
    'profile',
    'objective',
    'about',
    'about me',
    'skills',
    'technical skills',
    'technologies',
    'core competencies',
    'education',
    'academic background',
    'qualifications',
    'experience',
    'work experience',
    'employment history',
    'work history',
    'projects',
    'personal projects',
    'key projects',
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    const cleanHeader = trimmed.toLowerCase().replace(/[^a-z\s]/g, '').trim();

    if (knownHeaders.includes(cleanHeader) && trimmed.length < 35) {
      if (currentHeader) {
        sections[currentHeader] = currentLines.join('\n').trim();
      }
      currentHeader = cleanHeader;
      currentLines = [];
    } else if (currentHeader) {
      currentLines.push(trimmed);
    }
  }

  if (currentHeader && currentLines.length > 0) {
    sections[currentHeader] = currentLines.join('\n').trim();
  }

  return sections;
}

/**
 * Extracts list of skills from skills section or full text.
 */
function extractSkillsList(skillsSectionText: string, fullText: string): string[] {
  const skillCandidates = new Set<string>();

  if (skillsSectionText) {
    const items = skillsSectionText
      .split(/[,•|\n;]/)
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter((s) => s.length > 1 && s.length < 30);
    items.forEach((item) => skillCandidates.add(item));
  }

  // Pre-compiled list of common technical skills to match across full text
  const knownTech = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Express',
    'MongoDB',
    'Python',
    'Java',
    'C++',
    'HTML',
    'CSS',
    'Tailwind CSS',
    'Git',
    'Docker',
    'SQL',
    'PostgreSQL',
    'REST API',
    'GraphQL',
    'AWS',
    'Redux',
    'Next.js',
    'Vue.js',
    'Angular',
  ];

  for (const tech of knownTech) {
    const regex = new RegExp(`\\b${tech.replace('+', '\\+')}\\b`, 'i');
    if (regex.test(fullText)) {
      skillCandidates.add(tech);
    }
  }

  return Array.from(skillCandidates).slice(0, 25);
}

/**
 * Parses education section lines into structured education objects.
 */
function parseEducationSection(educationText: string): ParsedEducation[] {
  if (!educationText) return [];

  const lines = educationText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedEducation[] = [];

  let currentEdu: ParsedEducation = {
    institution: null,
    degree: null,
    field: null,
    startDate: null,
    endDate: null,
  };

  const degreeKeywords = ['B.Tech', 'B.E.', 'B.Sc', 'M.Tech', 'M.Sc', 'MBA', 'Bachelor', 'Master', 'Ph.D', 'Diploma', 'Secondary'];

  for (const line of lines) {
    const foundDegree = degreeKeywords.find((deg) => new RegExp(`\\b${deg}\\b`, 'i').test(line));
    if (foundDegree || line.toLowerCase().includes('university') || line.toLowerCase().includes('college') || line.toLowerCase().includes('institute')) {
      if (currentEdu.institution || currentEdu.degree) {
        results.push({ ...currentEdu });
        currentEdu = { institution: null, degree: null, field: null, startDate: null, endDate: null };
      }

      if (foundDegree) currentEdu.degree = foundDegree;
      if (line.toLowerCase().includes('university') || line.toLowerCase().includes('college') || line.toLowerCase().includes('institute')) {
        currentEdu.institution = line;
      }
    }

    const yearMatch = line.match(/(20\d{2}|19\d{2})/g);
    if (yearMatch) {
      if (yearMatch.length >= 2) {
        currentEdu.startDate = yearMatch[0];
        currentEdu.endDate = yearMatch[1];
      } else {
        currentEdu.endDate = yearMatch[0];
      }
    }
  }

  if (currentEdu.institution || currentEdu.degree) {
    results.push(currentEdu);
  }

  return results.slice(0, 5);
}

/**
 * Parses experience section lines into structured experience objects.
 */
function parseExperienceSection(expText: string): ParsedExperience[] {
  if (!expText) return [];

  const lines = expText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedExperience[] = [];

  let currentExp: ParsedExperience = {
    company: null,
    position: null,
    startDate: null,
    endDate: null,
    description: null,
  };

  const positionKeywords = ['Developer', 'Engineer', 'Architect', 'Manager', 'Analyst', 'Intern', 'Lead', 'Consultant', 'Executive'];

  for (const line of lines) {
    const foundPosition = positionKeywords.find((pos) => new RegExp(`\\b${pos}\\b`, 'i').test(line));
    if (foundPosition || line.toLowerCase().includes('inc') || line.toLowerCase().includes('ltd') || line.toLowerCase().includes('pvt')) {
      if (currentExp.company || currentExp.position) {
        results.push({ ...currentExp });
        currentExp = { company: null, position: null, startDate: null, endDate: null, description: null };
      }

      if (foundPosition) currentExp.position = line;
      if (line.toLowerCase().includes('inc') || line.toLowerCase().includes('ltd') || line.toLowerCase().includes('pvt') || line.toLowerCase().includes('technologies')) {
        currentExp.company = line;
      }
    } else if (currentExp.position && !currentExp.description) {
      currentExp.description = line;
    }

    const yearMatch = line.match(/(20\d{2}|19\d{2})\s*[-–toPresent]+\s*(20\d{2}|19\d{2}|Present)?/i);
    if (yearMatch) {
      currentExp.startDate = yearMatch[1] || null;
      currentExp.endDate = yearMatch[2] || 'Present';
    }
  }

  if (currentExp.company || currentExp.position) {
    results.push(currentExp);
  }

  return results.slice(0, 5);
}

/**
 * Parses projects section lines into structured project objects.
 */
function parseProjectsSection(projText: string): ParsedProject[] {
  if (!projText) return [];

  const lines = projText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedProject[] = [];

  let currentProj: ParsedProject = {
    name: null,
    description: null,
    technologies: [],
  };

  for (const line of lines) {
    if (!currentProj.name) {
      currentProj.name = line.replace(/^[-*•]\s*/, '').trim();
    } else if (!currentProj.description) {
      currentProj.description = line;
      results.push({ ...currentProj });
      currentProj = { name: null, description: null, technologies: [] };
    }
  }

  if (currentProj.name && !results.some((p) => p.name === currentProj.name)) {
    results.push(currentProj);
  }

  return results.slice(0, 5);
}
