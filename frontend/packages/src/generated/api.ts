import { useMutation, useQuery, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
import type * as schemas from "./api.schemas";

// Query Keys
export const getGetCurrentUserQueryKey = () => ["/api/auth/me"] as const;
export const getListHistoryQueryKey = (page?: number, pageSize?: number) => 
  ["/api/history", { page, pageSize }] as const;
export const getGetDownloadStatsQueryKey = () => ["/api/download/stats"] as const;

// Download Hooks
export function useGetDownloadInfo(
  options?: UseMutationOptions<schemas.VideoInfo, Error, { data: schemas.DownloadInfoRequest }>
) {
  return useMutation({
    mutationFn: async ({ data }: { data: schemas.DownloadInfoRequest }) =>
      customFetch<schemas.VideoInfo>("/api/download/info", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
}

export function useStartDownload(
  options?: UseMutationOptions<schemas.DownloadJob, Error, { data: schemas.DownloadStartRequest }>
) {
  return useMutation({
    mutationFn: async ({ data }: { data: schemas.DownloadStartRequest }) =>
      customFetch<schemas.DownloadJob>("/api/download/start", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
}

export function useGetDownloadStats(
  options?: UseQueryOptions<schemas.DownloadStats, Error>
) {
  return useQuery({
    queryKey: getGetDownloadStatsQueryKey(),
    queryFn: () => customFetch<schemas.DownloadStats>("/api/download/stats"),
    ...options,
  });
}

// Auth Hooks
export function useRegister(
  options?: UseMutationOptions<schemas.AuthResponse, Error, { data: schemas.RegisterRequest }>
) {
  return useMutation({
    mutationFn: async ({ data }: { data: schemas.RegisterRequest }) =>
      customFetch<schemas.AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
}

export function useLogin(
  options?: UseMutationOptions<schemas.AuthResponse, Error, { data: schemas.LoginRequest }>
) {
  return useMutation({
    mutationFn: async ({ data }: { data: schemas.LoginRequest }) =>
      customFetch<schemas.AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
}

export function useLogout(
  options?: UseMutationOptions<schemas.SuccessResponse, Error>
) {
  return useMutation({
    mutationFn: () =>
      customFetch<schemas.SuccessResponse>("/api/auth/logout", {
        method: "POST",
      }),
    ...options,
  });
}

export function useGetCurrentUser(
  options?: UseQueryOptions<schemas.MeResponse, Error>
) {
  return useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: () => customFetch<schemas.MeResponse>("/api/auth/me"),
    ...options,
  });
}

// History Hooks
export function useListHistory(
  page?: number,
  pageSize?: number,
  options?: UseQueryOptions<schemas.HistoryPage, Error>
) {
  return useQuery({
    queryKey: getListHistoryQueryKey(page, pageSize),
    queryFn: () => {
      const params = new URLSearchParams();
      if (page) params.append("page", page.toString());
      if (pageSize) params.append("pageSize", pageSize.toString());
      const query = params.toString() ? `?${params.toString()}` : "";
      return customFetch<schemas.HistoryPage>(`/api/history${query}`);
    },
    ...options,
  });
}

export function useDeleteHistoryItem(
  options?: UseMutationOptions<schemas.SuccessResponse, Error, { id: string }>
) {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      customFetch<schemas.SuccessResponse>(`/api/history/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
}

// Blog Hooks
export const getListBlogPostsQueryKey = () => ["/api/blog"] as const;
export const getGetBlogPostQueryKey = (slug: string) => ["/api/blog", slug] as const;

export function useListBlogPosts(
  options?: UseQueryOptions<schemas.BlogPostSummary[], Error>
) {
  return useQuery({
    queryKey: getListBlogPostsQueryKey(),
    queryFn: () => customFetch<schemas.BlogPostSummary[]>("/api/blog"),
    ...options,
  });
}

export function useGetBlogPost(
  slug: string,
  options?: UseQueryOptions<schemas.BlogPost, Error>
) {
  return useQuery({
    queryKey: getGetBlogPostQueryKey(slug),
    queryFn: () => customFetch<schemas.BlogPost>(`/api/blog/${slug}`),
    enabled: !!slug,
    ...options,
  });
}
