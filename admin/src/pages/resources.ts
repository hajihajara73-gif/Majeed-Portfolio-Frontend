import type { ResourceConfig } from '@/components/ResourcePage'

const str = (row: Record<string, unknown>, key: string): string =>
  row[key] == null ? '' : String(row[key])

export const projectsConfig: ResourceConfig = {
  path: '/admin/projects',
  title: 'Projects',
  description:
    'Slug is fixed after creation — changing it would break any link already published.',
  reorderable: true,
  defaults: { status: 'live', is_published: true, is_featured: false },
  primary: (row) => str(row, 'short_title') || str(row, 'title'),
  secondary: (row) =>
    [
      str(row, 'category'),
      str(row, 'status'),
      row.is_featured ? 'featured' : '',
      row.is_published ? '' : 'unpublished',
      row.archived_at ? 'archived' : '',
    ]
      .filter(Boolean)
      .join(' · '),
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', createOnly: true, required: true },
    { name: 'title', label: 'Title', kind: 'text', required: true },
    { name: 'short_title', label: 'Short title', kind: 'text' },
    { name: 'category', label: 'Category', kind: 'text' },
    { name: 'organization', label: 'Organisation', kind: 'text' },
    {
      name: 'status',
      label: 'Status',
      kind: 'select',
      options: [
        { value: 'live', label: 'Live' },
        { value: 'local', label: 'Local only' },
        { value: 'in-progress', label: 'In progress' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      name: 'deployment_note',
      label: 'Deployment note',
      kind: 'text',
      hint: 'Shown instead of a live link, e.g. "Local deployment".',
    },
    { name: 'live_url', label: 'Live URL', kind: 'text' },
    { name: 'github_url', label: 'GitHub URL', kind: 'text' },
    { name: 'summary', label: 'Summary', kind: 'textarea' },
    { name: 'description', label: 'Description paragraphs', kind: 'list' },
    { name: 'technologies', label: 'Technologies', kind: 'list' },
    { name: 'highlights', label: 'Highlights', kind: 'list' },
    { name: 'problem', label: 'Problem', kind: 'textarea' },
    { name: 'features', label: 'Features', kind: 'list' },
    { name: 'challenges', label: 'Challenges', kind: 'list' },
    { name: 'solutions', label: 'Approach', kind: 'list' },
    { name: 'results', label: 'Results', kind: 'list' },
    { name: 'architecture', label: 'Architecture', kind: 'textarea' },
    { name: 'cover_media_id', label: 'Cover image', kind: 'media', mediaKind: 'image' },
    { name: 'is_featured', label: 'Featured', kind: 'boolean' },
    { name: 'is_published', label: 'Published', kind: 'boolean' },
  ],
}

export const achievementCategoriesConfig: ResourceConfig = {
  path: '/admin/achievement-categories',
  title: 'Certificate categories',
  description:
    'Topical groupings for certificates — "Cyber Security", "Python", and so on. Drag to set the order they appear in on the site; the certificates inside each one keep their own order.',
  reorderable: true,
  defaults: { is_visible: true },
  primary: (row) => str(row, 'label'),
  secondary: (row) => str(row, 'slug'),
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', createOnly: true, required: true },
    { name: 'label', label: 'Label', kind: 'text', required: true },
    { name: 'summary', label: 'Summary', kind: 'textarea' },
    { name: 'is_visible', label: 'Visible', kind: 'boolean' },
  ],
}

/** Shared by both halves of the achievements table. */
const achievementFields: ResourceConfig['fields'] = [
  { name: 'organization', label: 'Organisation', kind: 'text' },
  { name: 'date_label', label: 'Date', kind: 'text', hint: 'Free text, e.g. "July 2023".' },
  { name: 'description', label: 'Description', kind: 'textarea' },
  { name: 'credential_id', label: 'Credential ID', kind: 'text' },
  { name: 'verification_url', label: 'Verification URL', kind: 'text' },
  { name: 'image_media_id', label: 'Scan image', kind: 'media', mediaKind: 'image', hint: 'Leave empty to list the credential without publishing its scan.' },
  { name: 'document_media_id', label: 'Document (PDF)', kind: 'media', mediaKind: 'document' },
  { name: 'is_featured', label: 'Featured', kind: 'boolean' },
  { name: 'is_public', label: 'Public', kind: 'boolean' },
  { name: 'allow_download', label: 'Allow download', kind: 'boolean' },
]

const TYPE_OPTIONS = [
  { value: 'award', label: 'Award' },
  { value: 'competition', label: 'Competition' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'milestone', label: 'Milestone' },
]

/**
 * Certificates and achievements are two pages over one table, split on
 * `achievement_type`. One table because they are the same record with the
 * same fields, the same media handling and the same privacy rules — a second
 * table would be the same columns under a different name.
 */
export const certificatesConfig: ResourceConfig = {
  path: '/admin/achievements',
  title: 'Certificates',
  description:
    'Courses and credentials. Assign a category to group them on the site. A credential can be listed without publishing its scan — leave the media fields empty.',
  reorderable: true,
  filter: (row) => row.achievement_type === 'certificate',
  defaults: { achievement_type: 'certificate', is_public: true, allow_download: true },
  primary: (row) => str(row, 'title'),
  secondary: (row) =>
    [str(row, 'organization'), str(row, 'date_label')].filter(Boolean).join(' · '),
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', createOnly: true, required: true },
    { name: 'title', label: 'Title', kind: 'text', required: true },
    {
      name: 'category_id',
      label: 'Category',
      kind: 'select',
      optionsFrom: '/admin/achievement-categories',
      hint: 'Optional. Uncategorised certificates are listed on their own.',
    },
    ...achievementFields,
  ],
}

export const achievementsConfig: ResourceConfig = {
  path: '/admin/achievements',
  title: 'Achievements',
  description:
    'Awards, competitions, presentations and milestones — everything that is not a course certificate.',
  reorderable: true,
  filter: (row) => row.achievement_type !== 'certificate',
  defaults: { achievement_type: 'award', is_public: true, allow_download: true },
  primary: (row) => str(row, 'title'),
  secondary: (row) =>
    [str(row, 'organization'), str(row, 'date_label'), str(row, 'achievement_type')]
      .filter(Boolean)
      .join(' · '),
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', createOnly: true, required: true },
    { name: 'title', label: 'Title', kind: 'text', required: true },
    { name: 'achievement_type', label: 'Type', kind: 'select', options: TYPE_OPTIONS },
    ...achievementFields,
  ],
}

export const skillCategoriesConfig: ResourceConfig = {
  path: '/admin/skill-categories',
  title: 'Skill categories',
  reorderable: true,
  defaults: { is_visible: true },
  primary: (row) => str(row, 'label'),
  secondary: (row) =>
    `${str(row, 'slug')} · ${(row.skills as unknown[] | undefined)?.length ?? 0} skills`,
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', createOnly: true, required: true },
    { name: 'label', label: 'Label', kind: 'text', required: true },
    { name: 'summary', label: 'Summary', kind: 'textarea' },
    { name: 'is_visible', label: 'Visible', kind: 'boolean' },
  ],
}

export const skillsConfig: ResourceConfig = {
  path: '/admin/skills',
  title: 'Skills',
  description:
    'Proficiency is optional and left empty on purpose — the public site shows no progress bars.',
  reorderable: true,
  defaults: { is_visible: true, is_featured: false },
  primary: (row) => str(row, 'name'),
  secondary: (row) => str(row, 'category_id'),
  fields: [
    { name: 'category_id', label: 'Category id', kind: 'text', required: true },
    { name: 'name', label: 'Name', kind: 'text', required: true },
    { name: 'note', label: 'Note', kind: 'text' },
    { name: 'icon', label: 'Icon', kind: 'text' },
    { name: 'is_visible', label: 'Visible', kind: 'boolean' },
    { name: 'is_featured', label: 'Featured', kind: 'boolean' },
  ],
}

export const careerConfig: ResourceConfig = {
  path: '/admin/career',
  title: 'Career timeline',
  reorderable: true,
  defaults: { entry_type: 'education', is_visible: true },
  primary: (row) => str(row, 'title'),
  secondary: (row) =>
    [str(row, 'organization'), str(row, 'start_label'), str(row, 'end_label')]
      .filter(Boolean)
      .join(' · '),
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true },
    { name: 'organization', label: 'Organisation', kind: 'text' },
    {
      name: 'entry_type',
      label: 'Type',
      kind: 'select',
      options: [
        { value: 'education', label: 'Education' },
        { value: 'experience', label: 'Experience' },
        { value: 'milestone', label: 'Milestone' },
      ],
    },
    { name: 'start_label', label: 'Start', kind: 'text' },
    { name: 'end_label', label: 'End', kind: 'text' },
    { name: 'location', label: 'Location', kind: 'text' },
    { name: 'description', label: 'Description', kind: 'textarea' },
    { name: 'technologies', label: 'Technologies', kind: 'list' },
    { name: 'is_current', label: 'Current', kind: 'boolean' },
    { name: 'is_visible', label: 'Visible', kind: 'boolean' },
  ],
}

export const educationConfig: ResourceConfig = {
  path: '/admin/education',
  title: 'Education',
  reorderable: true,
  defaults: { is_visible: true },
  primary: (row) => str(row, 'degree'),
  secondary: (row) =>
    [str(row, 'institution'), str(row, 'start_label'), str(row, 'end_label')]
      .filter(Boolean)
      .join(' · '),
  fields: [
    { name: 'degree', label: 'Degree', kind: 'text', required: true },
    { name: 'institution', label: 'Institution', kind: 'text', required: true },
    { name: 'start_label', label: 'Start', kind: 'text' },
    { name: 'end_label', label: 'End', kind: 'text' },
    { name: 'location', label: 'Location', kind: 'text' },
    { name: 'description', label: 'Description', kind: 'textarea' },
    { name: 'is_visible', label: 'Visible', kind: 'boolean' },
  ],
}

export const expertiseConfig: ResourceConfig = {
  path: '/admin/expertise',
  title: 'Areas of expertise',
  reorderable: true,
  defaults: { is_visible: true },
  primary: (row) => str(row, 'title'),
  secondary: (row) => str(row, 'summary'),
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true },
    { name: 'summary', label: 'Summary', kind: 'textarea' },
    { name: 'is_visible', label: 'Visible', kind: 'boolean' },
  ],
}

export const socialConfig: ResourceConfig = {
  path: '/admin/social',
  title: 'Social links',
  description:
    'Only http, https, mailto, tel and in-page links are accepted — other schemes are rejected by the API.',
  reorderable: true,
  defaults: { is_external: true, is_visible: true },
  primary: (row) => str(row, 'label'),
  secondary: (row) => str(row, 'href'),
  fields: [
    { name: 'label', label: 'Label', kind: 'text', required: true },
    { name: 'href', label: 'URL', kind: 'text', required: true },
    { name: 'is_external', label: 'Opens in new tab', kind: 'boolean' },
    { name: 'is_visible', label: 'Visible', kind: 'boolean' },
  ],
}
