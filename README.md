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

```typescript
import { useQueryState } from '@bhammond/react-stateful';

function MyComponent() {
  const [value, setValue] = useQueryState(false, 'showDialog');

  return (
    <button onClick={() => setValue(!value)}>
      {value ? 'Hide' : 'Show'} Dialog
    </button>
  );
}
```

## Advanced Usage

### With Server-Side Parameters (Next.js)

```typescript
// app/page.tsx (Server Component)
import { useSearchParams } from 'next/navigation';
import MyClientComponent from './my-client-component';

export default function Page() {
  const searchParams = useSearchParams();
  const serverParams = Object.fromEntries(searchParams.entries());
  
  return <MyClientComponent serverParams={serverParams} />;
}

// my-client-component.tsx (Client Component)
'use client';

import { useQueryState } from '@bhammond/react-stateful';

function MyClientComponent({ serverParams }) {
  const [value, setValue] = useQueryState(false, 'showDialog', { serverParams });
  // ...
}
```

### Sharing State Between Components

```typescript
function ComponentA() {
  const [count, setCount] = useQueryState(0, 'counter');
  return <button onClick={() => setCount(c => c + 1)}>Increment: {count}</button>;
}

function ComponentB() {
  const [count, setCount] = useQueryState(0, 'counter');
  return <div>Current count: {count}</div>;
}
```

### Working with Objects

```typescript
interface Filter {
  category: string;
  sort: 'asc' | 'desc';
}

function FilterComponent() {
  const [filters, setFilters] = useQueryState<Filter>(
    { category: 'all', sort: 'asc' },
    'filters'
  );

  return (
    <div>
      <select
        value={filters.category}
        onChange={e => setFilters({ ...filters, category: e.target.value })}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
      </select>
      <button
        onClick={() => setFilters(f => ({ 
          ...f, 
          sort: f.sort === 'asc' ? 'desc' : 'asc' 
        }))}
      >
        Toggle Sort
      </button>
    </div>
  );
}
```

## API Reference

### useQueryState

```typescript
function useQueryState<T>(
  defaultValue: T,
  queryKey?: string,
  config?: {
    serverParams?: Record<string, string>;
  }
): [T, (newValue: T | ((prev: T) => T)) => void]
```

#### Parameters

- `defaultValue: T` - Initial value for the state
- `queryKey?: string` - URL parameter key (optional, defaults to stringified defaultValue)
- `config?: Object` - Configuration options
  - `serverParams?: Record<string, string>` - Initial parameters from server-side rendering

#### Returns

- `[value, setValue]` - A tuple containing the current value and setter function

#### Supported Types

- Primitives (string, number, boolean)
- Objects (automatically serialized/deserialized)
- Arrays
- null

## Notes

- The hook automatically handles URL encoding/decoding
- URL parameters are removed when the value is `null` or `false`
- Objects are automatically serialized to JSON in the URL
- Browser history is preserved and works with forward/back navigation
- State is shared between all instances using the same key

## Examples

### Form State

```typescript
function SearchForm() {
  const [query, setQuery] = useQueryState('', 'q');
  
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

### Pagination

```typescript
function Pagination() {
  const [page, setPage] = useQueryState(1, 'page');
  
  return (
    <div>
      <button onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
      <span>Page {page}</span>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}
```

### Complex Filters

```typescript
interface Filters {
  search: string;
  category: string;
  sortBy: string;
  page: number;
}

function FilterPanel() {
  const [filters, setFilters] = useQueryState<Filters>({
    search: '',
    category: 'all',
    sortBy: 'date',
    page: 1
  }, 'filters');

  const updateFilter = (key: keyof Filters, value: any) => {
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