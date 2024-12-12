# @bhammond/react-stateful

Framework-agnostic URL-synchronized state management with built-in state sharing between components. Uses signals to share state efficiently between components.

## Features

- 🔄 State sharing between components using signals
- 🌐 URL synchronization with component state
- 🧭 Browser navigation (back/forward) support
- 🤝 Framework agnostic design
- 📦 TypeScript included
- 🪶 Small bundle size (~1KB)
- 💪 No dependencies

## Installation

```bash
npm install @bhammond/react-stateful
```

### Requirements

- React 16.8+

## Basic Usage

```typescript
import { useQueryState } from '@bhammond/react-stateful';

function SearchComponent() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useQueryState('q', params);

  return (
    <input
      value={query ?? ''}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## State Sharing Between Components

Components using the same key will share state through signals:

```typescript
import { useQueryState } from '@bhammond/react-stateful';

function SearchInput({ params }) {
  const [query, setQuery] = useQueryState('q', params);
  return <input value={query ?? ''} onChange={e => setQuery(e.target.value)} />;
}

function SearchResults({ params }) {
  const [query] = useQueryState('q', params);
  return <div>Results for: {query}</div>;
}

function FilterStatus({ params }) {
  const [query] = useQueryState('q', params);
  return <div>Current filter: {query || 'None'}</div>;
}

function SearchPage() {
  const params = new URLSearchParams(window.location.search);
  return (
    <div>
      <SearchInput params={params} />
      <FilterStatus params={params} />
      <SearchResults params={params} />
    </div>
  );
}
```

## Complex Objects

The hook works with complex objects and maintains type safety:

```typescript
interface Filters {
  search: string;
  category: string;
  sortBy: string;
  page: number;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: 'all',
  sortBy: 'date',
  page: 1
};

function FilterPanel({ params }) {
  const [filters, setFilters] = useQueryState<Filters>('filters', params, DEFAULT_FILTERS);

  const updateFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
    setFilters(current => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1
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
    </div>
  );
}
```

## API Reference

### useQueryState

```typescript
function useQueryState<T = string>(
  name: string,
  params: ParamsInput,
  defaultValue?: T
): [T, (newValue: T | ((prev: T) => T)) => void]
```

#### Parameters

- `name: string` - URL parameter key
- `params: ParamsInput` - Either:
  - `URLParamsLike`: An object with a `get(key: string): string | null` method
  - `RecordParams`: An object with string or string array values
- `defaultValue?: T` - Optional default value when parameter is not present

#### Returns

- `[value, setValue]` - A tuple containing the current value and setter function

## Framework Integration

### React Router

```typescript
import { useSearchParams } from 'react-router-dom';
import { useQueryState } from '@bhammond/react-stateful';

function SearchComponent() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useQueryState('q', searchParams);

  return (
    <input
      value={query ?? ''}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

### Custom Implementation

```typescript
class CustomParams implements URLParamsLike {
  private params: Map<string, string>;

  constructor() {
    this.params = new Map();
  }

  get(key: string): string | null {
    return this.params.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.params.set(key, value);
  }
}

function Component() {
  const params = new CustomParams();
  const [value, setValue] = useQueryState('key', params);
  // ...
}
```

## TypeScript Support

Includes TypeScript definitions with full type inference support.

## Performance

- Signal-based state sharing
- Selective component updates
- Batched URL updates
- Small bundle size
- No external dependencies

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## License

MIT