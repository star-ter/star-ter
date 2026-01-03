import { create } from 'zustand';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useModalStore } from '@/stores/useModalStore';

interface Bookmark {
  id: string;
  user_id: string;
  commercialCode: string;
  commercialName: string;
  createdAt: string;
}

interface BookmarkStore {
  bookmarks: Bookmark[];
  loading: boolean;
  fetchBookmarks: () => Promise<void>;
  addBookmark: (
    commercialCode: string,
    commercialName: string,
  ) => Promise<boolean>;
  removeBookmark: (commercialCode: string) => Promise<boolean>;
}

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  bookmarks: [],
  loading: false,

  fetchBookmarks: async () => {
    try {
      set({ loading: true });
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ bookmarks: [], loading: false });
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookmark`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        set({ bookmarks: data });
      } else if (res.status === 401) {
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('accessToken');
        set({ bookmarks: [] });
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      set({ loading: false });
    }
  },

  addBookmark: async (commercialCode: string, commercialName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        useModalStore.getState().openModal({
          type: 'confirm',
          title: '로그인 필요',
          content: (
            <div className="text-center py-4">
              <p className="mb-2 text-gray-700">
                로그인이 필요한 서비스입니다.
              </p>
              <p className="text-base font-bold text-gray-900">
                로그인 페이지로 이동하시겠습니까?
              </p>
            </div>
          ),
          confirmText: '로그인하기',
          onConfirm: () => {
            window.location.href = '/login';
          },
        });
        return false;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookmark`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ commercialCode, commercialName }),
        },
      );

      if (res.ok) {
        await get().fetchBookmarks();
        toast.success(`'${commercialName}' 즐겨찾기 추가 완료!`);
        return true;
      } else {
        if (res.status === 409) {
          toast.error('이미 즐겨찾기된 상권입니다.');
        } else if (res.status === 401) {
          useModalStore.getState().openModal({
            type: 'confirm',
            title: '세션 만료',
            content: '로그인이 만료되었습니다.\n다시 로그인 하시겠습니까?',
            confirmText: '로그인하기',
            onConfirm: () => {
              localStorage.removeItem('accessToken');
              set({ bookmarks: [] });
              window.location.href = '/login';
            },
          });
          localStorage.removeItem('accessToken');
          set({ bookmarks: [] });
        } else {
          toast.error('즐겨찾기 추가에 실패했습니다.');
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      toast.error('오류가 발생했습니다.');
      return false;
    }
  },

  removeBookmark: async (commercialCode: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookmark/${commercialCode}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        await get().fetchBookmarks();
        toast.success('즐겨찾기가 삭제되었습니다.');
        return true;
      } else {
        if (res.status === 401) {
          toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('accessToken');
          set({ bookmarks: [] });
        } else {
          toast.error('즐겨찾기 삭제에 실패했습니다.');
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      toast.error('오류가 발생했습니다.');
      return false;
    }
  },
}));

// Compatibility hook to maintain existing API
export const useBookmark = () => {
  const store = useBookmarkStore();
  const { bookmarks, fetchBookmarks } = store;

  useEffect(() => {
    // Only fetch if empty and token exists, or on mount
    const token = localStorage.getItem('accessToken');
    if (token && bookmarks.length === 0) {
      fetchBookmarks();
    }
  }, [bookmarks.length, fetchBookmarks]);

  return {
    bookmarks: store.bookmarks,
    loading: store.loading,
    addBookmark: store.addBookmark,
    removeBookmark: store.removeBookmark,
    refetch: store.fetchBookmarks,
  };
};
