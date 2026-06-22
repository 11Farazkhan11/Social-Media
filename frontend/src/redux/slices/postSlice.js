import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchFeedPosts = createAsyncThunk('posts/feed', async ({ page = 1 } = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/posts/feed?page=${page}&limit=10`);
    return { ...data.data, page };
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchExplorePosts = createAsyncThunk('posts/explore', async ({ page = 1 } = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/posts/explore?page=${page}&limit=12`);
    return { ...data.data, page };
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createPost = createAsyncThunk('posts/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.data.post;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deletePost = createAsyncThunk('posts/delete', async (postId, { rejectWithValue }) => {
  try {
    await api.delete(`/posts/${postId}`);
    return postId;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const toggleLike = createAsyncThunk('posts/like', async (postId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/posts/${postId}/like`);
    return { postId, ...data.data };
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    feed: [], explorePosts: [], hasMoreFeed: true, hasMoreExplore: true,
    feedPage: 1, explorePage: 1, loading: false, error: null,
  },
  reducers: {
    addCommentToPost: (state, action) => {
      const { postId, comment } = action.payload;
      const updatePost = (posts) => posts.map(p =>
        p._id === postId ? { ...p, comments: [...p.comments, comment] } : p
      );
      state.feed = updatePost(state.feed);
      state.explorePosts = updatePost(state.explorePosts);
    },
    removeCommentFromPost: (state, action) => {
      const { postId, commentId } = action.payload;
      const updatePost = (posts) => posts.map(p =>
        p._id === postId ? { ...p, comments: p.comments.filter(c => (c._id || c) !== commentId) } : p
      );
      state.feed = updatePost(state.feed);
      state.explorePosts = updatePost(state.explorePosts);
    },
    resetFeed: (state) => { state.feed = []; state.feedPage = 1; state.hasMoreFeed = true; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedPosts.pending, (state) => { state.loading = true; })
      .addCase(fetchFeedPosts.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) state.feed = action.payload.posts;
        else state.feed = [...state.feed, ...action.payload.posts];
        state.hasMoreFeed = action.payload.hasMore;
        state.feedPage = action.payload.page;
      })
      .addCase(fetchFeedPosts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchExplorePosts.fulfilled, (state, action) => {
        if (action.payload.page === 1) state.explorePosts = action.payload.posts;
        else state.explorePosts = [...state.explorePosts, ...action.payload.posts];
        state.hasMoreExplore = action.payload.hasMore;
        state.explorePage = action.payload.page;
      })

      .addCase(createPost.fulfilled, (state, action) => {
        state.feed = [action.payload, ...state.feed];
      })

      .addCase(deletePost.fulfilled, (state, action) => {
        state.feed = state.feed.filter(p => p._id !== action.payload);
        state.explorePosts = state.explorePosts.filter(p => p._id !== action.payload);
      })

      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, liked, likesCount } = action.payload;
        const update = (posts) => posts.map(p =>
          p._id === postId ? { ...p, likesCount, liked } : p
        );
        state.feed = update(state.feed);
        state.explorePosts = update(state.explorePosts);
      });
  },
});

export const { addCommentToPost, removeCommentFromPost, resetFeed } = postSlice.actions;
export default postSlice.reducer;
