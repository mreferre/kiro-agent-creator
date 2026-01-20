import { useState } from 'react';
import type { AgentConfiguration, ValidationErrors, Resource, KnowledgeBaseResource } from '../types/agent-config';
import { FieldWithTooltip } from './FieldWithTooltip';

/**
 * Props for the ResourcesSection component
 */
interface ResourcesSectionProps {
  config: Pick<AgentConfiguration, 'resources'>;
  onChange: (updates: Partial<AgentConfiguration>) => void;
  errors: ValidationErrors;
}

/**
 * Field documentation for tooltips
 */
const fieldDocs = {
  resources: {
    tooltip: 'Configure resources available to the agent. Resources can be simple URIs (file://, skill://) or knowledge base configurations.',
    example: 'file://./docs, skill://code-review',
  },
  uri: {
    tooltip: 'A URI pointing to a resource. Supports file:// and skill:// protocols.',
    example: 'file://./README.md, skill://debugging',
  },
  knowledgeBase: {
    source: {
      tooltip: 'The source path or URL for the knowledge base.',
      example: './docs, https://docs.example.com',
    },
    name: {
      tooltip: 'A human-readable name for the knowledge base.',
      example: 'Project Documentation',
    },
    description: {
      tooltip: 'Optional description of the knowledge base contents.',
      example: 'Contains API documentation and guides',
    },
    indexType: {
      tooltip: 'Indexing strategy: "best" for quality, "fast" for speed.',
    },
    autoUpdate: {
      tooltip: 'Whether to automatically update the index when source changes.',
    },
  },
};

/**
 * Check if a resource is a knowledge base
 */
function isKnowledgeBase(resource: Resource): resource is KnowledgeBaseResource {
  return typeof resource === 'object' && resource.type === 'knowledgeBase';
}

/**
 * ResourcesSection Component
 * 
 * Handles resources configuration:
 * - Simple URI resources (file://, skill://)
 * - Knowledge base resources with full configuration
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export function ResourcesSection({ config, onChange, errors }: ResourcesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'uri' | 'knowledgeBase'>('uri');
  const [newUri, setNewUri] = useState('');
  const [newKb, setNewKb] = useState<Partial<KnowledgeBaseResource>>({
    type: 'knowledgeBase',
    source: '',
    name: '',
  });

  const resources = config.resources || [];

  /**
   * Update resources
   */
  const updateResources = (newResources: Resource[]) => {
    onChange({ resources: newResources.length > 0 ? newResources : undefined });
  };

  /**
   * Add a URI resource
   */
  const handleAddUri = () => {
    if (!newUri.trim()) return;
    updateResources([...resources, newUri.trim()]);
    setNewUri('');
    setShowAddForm(false);
  };

  /**
   * Add a knowledge base resource
   */
  const handleAddKnowledgeBase = () => {
    if (!newKb.source?.trim() || !newKb.name?.trim()) return;
    
    const kb: KnowledgeBaseResource = {
      type: 'knowledgeBase',
      source: newKb.source.trim(),
      name: newKb.name.trim(),
      ...(newKb.description?.trim() && { description: newKb.description.trim() }),
      ...(newKb.indexType && { indexType: newKb.indexType }),
      ...(newKb.autoUpdate !== undefined && { autoUpdate: newKb.autoUpdate }),
    };
    
    updateResources([...resources, kb]);
    setNewKb({ type: 'knowledgeBase', source: '', name: '' });
    setShowAddForm(false);
  };

  /**
   * Remove a resource
   */
  const handleRemove = (index: number) => {
    const newResources = resources.filter((_, i) => i !== index);
    updateResources(newResources);
  };

  /**
   * Update a URI resource
   */
  const handleUriChange = (index: number, value: string) => {
    const newResources = [...resources];
    newResources[index] = value;
    updateResources(newResources);
  };

  /**
   * Update a knowledge base resource field
   */
  const handleKbChange = (index: number, field: keyof KnowledgeBaseResource, value: unknown) => {
    const newResources = [...resources];
    const kb = { ...(newResources[index] as KnowledgeBaseResource) };
    
    if (value === undefined || value === '') {
      delete (kb as Record<string, unknown>)[field];
    } else {
      (kb as Record<string, unknown>)[field] = value;
    }
    
    newResources[index] = kb;
    updateResources(newResources);
  };

  /**
   * Render a URI resource
   */
  const renderUriResource = (uri: string, index: number) => (
    <div 
      key={index}
      className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
      data-testid={`resource-uri-${index}`}
    >
      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
        URI
      </span>
      <input
        type="text"
        value={uri}
        onChange={(e) => handleUriChange(index, e.target.value)}
        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        data-testid={`resource-uri-${index}-input`}
      />
      <button
        type="button"
        onClick={() => handleRemove(index)}
        className="p-1 text-red-500 hover:text-red-700"
        title="Remove resource"
        data-testid={`resource-${index}-remove`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  /**
   * Render a knowledge base resource
   */
  const renderKnowledgeBaseResource = (kb: KnowledgeBaseResource, index: number) => (
    <div 
      key={index}
      className="p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20 space-y-3"
      data-testid={`resource-kb-${index}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
          Knowledge Base
        </span>
        <button
          type="button"
          onClick={() => handleRemove(index)}
          className="p-1 text-red-500 hover:text-red-700"
          title="Remove resource"
          data-testid={`resource-${index}-remove`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Source *
          </label>
          <input
            type="text"
            value={kb.source}
            onChange={(e) => handleKbChange(index, 'source', e.target.value)}
            placeholder={fieldDocs.knowledgeBase.source.example}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            data-testid={`resource-kb-${index}-source`}
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={kb.name}
            onChange={(e) => handleKbChange(index, 'name', e.target.value)}
            placeholder={fieldDocs.knowledgeBase.name.example}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            data-testid={`resource-kb-${index}-name`}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Description
        </label>
        <input
          type="text"
          value={kb.description || ''}
          onChange={(e) => handleKbChange(index, 'description', e.target.value || undefined)}
          placeholder={fieldDocs.knowledgeBase.description.example}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          data-testid={`resource-kb-${index}-description`}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Index Type
          </label>
          <select
            value={kb.indexType || ''}
            onChange={(e) => handleKbChange(index, 'indexType', e.target.value || undefined)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            data-testid={`resource-kb-${index}-indexType`}
          >
            <option value="">Default</option>
            <option value="best">Best (Quality)</option>
            <option value="fast">Fast (Speed)</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id={`kb-${index}-autoUpdate`}
            checked={kb.autoUpdate || false}
            onChange={(e) => handleKbChange(index, 'autoUpdate', e.target.checked || undefined)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            data-testid={`resource-kb-${index}-autoUpdate`}
          />
          <label htmlFor={`kb-${index}-autoUpdate`} className="text-xs text-gray-700 dark:text-gray-300">
            Auto-update
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
        Resources Configuration
      </h3>

      <FieldWithTooltip
        label="Resources"
        tooltip={fieldDocs.resources.tooltip}
        example={fieldDocs.resources.example}
        error={errors.resources}
      >
        <div className="space-y-3" data-testid="resources">
          {resources.length === 0 && !showAddForm && (
            <div 
              className="text-sm text-gray-500 dark:text-gray-400 italic py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md"
              data-testid="resources-empty"
            >
              No resources configured. Click "Add Resource" to add one.
            </div>
          )}

          {/* Existing resources */}
          {resources.map((resource, index) => 
            isKnowledgeBase(resource) 
              ? renderKnowledgeBaseResource(resource, index)
              : renderUriResource(resource, index)
          )}

          {/* Add resource form */}
          {showAddForm ? (
            <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
                <button
                  type="button"
                  onClick={() => setAddType('uri')}
                  className={`px-2 py-1 text-sm rounded ${addType === 'uri' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  data-testid="resource-add-type-uri"
                >
                  URI
                </button>
                <button
                  type="button"
                  onClick={() => setAddType('knowledgeBase')}
                  className={`px-2 py-1 text-sm rounded ${addType === 'knowledgeBase' ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  data-testid="resource-add-type-kb"
                >
                  Knowledge Base
                </button>
              </div>

              {addType === 'uri' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUri}
                    onChange={(e) => setNewUri(e.target.value)}
                    placeholder={fieldDocs.uri.example}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    data-testid="resource-add-uri-input"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUri()}
                  />
                  <button
                    type="button"
                    onClick={handleAddUri}
                    disabled={!newUri.trim()}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    data-testid="resource-add-uri-confirm"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Source *
                      </label>
                      <input
                        type="text"
                        value={newKb.source || ''}
                        onChange={(e) => setNewKb({ ...newKb, source: e.target.value })}
                        placeholder={fieldDocs.knowledgeBase.source.example}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid="resource-add-kb-source"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newKb.name || ''}
                        onChange={(e) => setNewKb({ ...newKb, name: e.target.value })}
                        placeholder={fieldDocs.knowledgeBase.name.example}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid="resource-add-kb-name"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddKnowledgeBase}
                    disabled={!newKb.source?.trim() || !newKb.name?.trim()}
                    className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    data-testid="resource-add-kb-confirm"
                  >
                    Add Knowledge Base
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewUri(''); setNewKb({ type: 'knowledgeBase', source: '', name: '' }); }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="resource-add-cancel"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
              data-testid="resource-add"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Resource
            </button>
          )}
        </div>
      </FieldWithTooltip>
    </div>
  );
}

export default ResourcesSection;
