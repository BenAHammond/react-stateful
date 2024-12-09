# @bhammond/react-stateful

A lightweight, type-safe React hook for managing state with URL parameters and cross-component synchronization.

## Features

- 🔄 Synchronizes state with URL parameters automatically
- 🤝 Shares state between components using the same key
- 🌐 Works with browser navigation (back/forward)
- 📦 TypeScript support out of the box
- ⚡️ Zero dependencies
- 🔒 SSR-safe with server-side parameter support

## Installation

```bash
npm install @bhammond/react-stateful
```

or

```bash
yarn add @bhammond/react-stateful
```

## Basic Usage

### JavaScript

```javascript
import { useQueryState } from '@bhammond/react-stateful';
import { useSearchParams } from 'next/navigation';

// In your Server Component
export default function Page() {
  const searchParams = useSearchParams();
  const serverParams = Object.fromEntries(searchParams.entries());
  
  return <MyClientComponent serverParams={serverParams} />;
}

// In your Client Component
function MyClientComponent({ serverParams }) {
  const [value, setValue] = useQueryState(false, serverParams, 'showDialog');

  return (
    <button onClick={() => setValue(!value)}>
      {value ? 'Hide' : 'Show'} Dialog
    </button>
  );
}
```

### TypeScript

```typescript
import { useQueryState } from '@bhammond/react-stateful';
import { useSearchParams } from 'next/navigation';

interface ServerProps {
  serverParams: Record<string, string>;
}

// In your Server Component
export default function Page() {
  const searchParams = useSearchParams();
  const serverParams = Object.fromEntries(searchParams.entries());
  
  return <MyClientComponent serverParams={serverParams} />;
}

// In your Client Component
function MyClientComponent({ serverParams }: ServerProps) {
  const [value, setValue] = useQueryState<boolean>(false, serverParams, 'showDialog');

  return (
    <button onClick={() => setValue(!value)}>
      {value ? 'Hide' : 'Show'} Dialog
    </button>
  );
}
```

## API Reference

### useQueryState

```typescript
function useQueryState<T>(
  defaultValue: T,
  serverParams: Record<string, string>,
  queryKey?: string
): [T, (newValue: T | ((prev: T) => T)) => T]
```

#### Parameters

- `defaultValue: T` - Initial value for the state if not found in URL parameters
- `serverParams: Record<string, string>` - URL parameters from server-side rendering
- `queryKey?: string` - URL parameter key (optional, defaults to stringified defaultValue)

#### Returns

- `[value, setValue]` - A tuple containing the current value and setter function

## Usage with Different Frameworks

### Next.js (App Router)

```javascript
// JavaScript
// app/page.js (Server Component)
import { useSearchParams } from 'next/navigation';
import FilterPanel from './filter-panel';

export default function Page() {
  const searchParams = useSearchParams();
  const serverParams = Object.fromEntries(searchParams.entries());
  
  return <FilterPanel serverParams={serverParams} />;
}

// filter-panel.js (Client Component)
'use client';

function FilterPanel({ serverParams }) {
  const [filters, setFilters] = useQueryState(
    {
      search: '',
      category: 'all',
      sortBy: 'date',
      page: 1
    },
    serverParams,
    'filters'
  );

  // ... rest of the component
}
```

```typescript
// TypeScript
interface Filters {
  search: string;
  category: string;
  sortBy: string;
  page: number;
}

interface ServerProps {
  serverParams: Record<string, string>;
}

// filter-panel.tsx (Client Component)
'use client';

function FilterPanel({ serverParams }: ServerProps) {
  const [filters, setFilters] = useQueryState<Filters>(
    {
      search: '',
      category: 'all',
      sortBy: 'date',
      page: 1
    },
    serverParams,
    'filters'
  );

  // ... rest of the component
}
```

## Examples

### Form State

#### JavaScript

```javascript
function SearchForm({ serverParams }) {
  const [query, setQuery] = useQueryState('', serverParams, 'q');
  
  return (
    <form onSubmit={e => e.preventDefault()}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={() => setQuery('')}>Clear</button>
    </form>
  );
}
```

#### TypeScript

```typescript
interface SearchFormProps {
  serverParams: Record<string, string>;
}

function SearchForm({ serverParams }: SearchFormProps) {
  const [query, setQuery] = useQueryState<string>('', serverParams, 'q');
  
  return (
    <form onSubmit={e => e.preventDefault()}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={() => setQuery('')}>Clear</button>
    </form>
  );
}
```

### Complex Filters

#### JavaScript

```javascript
function FilterPanel({ serverParams }) {
  const [filters, setFilters] = useQueryState(
    {
      search: '',
      category: 'all',
      sortBy: 'date',
      page: 1
    },
    serverParams,
    'filters'
  );

  const updateFilter = (key, value) => {
    setFilters(current => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset page when other filters change
    }));
  };

  return (
    <div>
      <input
        value={filters.search}
        onChange={e => updateFilter('search', e.target.value)}
      />
      <select
        value={filters.category}
        onChange={e => updateFilter('category', e.target.value)}
      >
        {/* options */}
      </select>
      {/* ... other filter controls */}
    </div>
  );
}
```

#### TypeScript

```typescript
interface Filters {
  search: string;
  category: string;
  sortBy: string;
  page: number;
}

interface FilterPanelProps {
  serverParams: Record<string, string>;
}

function FilterPanel({ serverParams }: FilterPanelProps) {
  const [filters, setFilters] = useQueryState<Filters>(
    {
      search: '',
      category: 'all',
      sortBy: 'date',
      page: 1
    },
    serverParams,
    'filters'
  );

  const updateFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
    setFilters(current => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset page when other filters change
    }));
  };

  return (
    <div>
      <input
        value={filters.search}
        onChange={e => updateFilter('search', e.target.value)}
      />
      <select
        value={filters.category}
        onChange={e => updateFilter('category', e.target.value)}
      >
        {/* options */}
      </select>
      {/* ... other filter controls */}
    </div>
  );
}
```

## License

MIT