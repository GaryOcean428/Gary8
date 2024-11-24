export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  license: {
    key: string;
    name: string;
    url: string;
  } | null;
  visibility: string;
  default_branch: string;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface PullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  mergeable: boolean | null;
  mergeable_state: string;
  draft: boolean;
}

export interface FileChange {
  path: string;
  content: string;
}