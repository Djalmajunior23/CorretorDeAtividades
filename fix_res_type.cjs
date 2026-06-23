const fs = require('fs');

const f = 'src/components/ResourceLibraryView.tsx';
let content = fs.readFileSync(f, 'utf8');

const typeDef = `
export interface ResourceLibraryItem {
  id: string;
  title: string;
  description?: string;
  type?: string;
  url?: string;
  tags?: string[];
  is_favorite?: boolean;
}
`;

if (!content.includes('interface ResourceLibraryItem')) {
  content = content.replace('export const ResourceLibraryView', typeDef + '\nexport const ResourceLibraryView');
  fs.writeFileSync(f, content, 'utf8');
  console.log('Fixed ResourceLibraryView');
}
