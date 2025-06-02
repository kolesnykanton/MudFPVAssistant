using Microsoft.AspNetCore.Components.Authorization;
using MudFPVAssistant.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MudFPVAssistant.Services
{
    /// <summary>
    /// Reactive wrapper over IUserDocumentService for a specific collection.
    /// Caches items in memory and automatically reloads them on login/logout.
    /// </summary>
    /// <typeparam name="T">Type of document stored in the collection (must have an 'Id' property of type string).</typeparam>
    public class ReactiveUserCollectionService<T> : IDisposable where T : class
    {
        private readonly IUserDocumentService _userDocs;
        private readonly AuthenticationStateProvider _authProvider;
        private readonly string _collectionName;

        // In-memory cache of documents
        private List<T> _items = new List<T>();

        /// <summary>
        /// Read-only view of current items in cache.
        /// </summary>
        public IReadOnlyList<T> Items => _items;

        /// <summary>
        /// Event triggered whenever the internal cache (_items) is updated.
        /// Components can subscribe to this to rerender themselves.
        /// </summary>
        public event Action? OnUpdated;

        private bool _isInitialized = false;

        /// <summary>
        /// Constructor: injects IUserDocumentService and AuthenticationStateProvider.
        /// Subscribes to AuthenticationStateChanged to reload/clear cache.
        /// </summary>
        /// <param name="userDocs">Underlying generic JS/Firestore service.</param>
        /// <param name="authProvider">Blazor authentication state provider.</param>
        /// <param name="collectionName">Name of the Firestore collection for this type.</param>
        public ReactiveUserCollectionService(
            IUserDocumentService userDocs,
            AuthenticationStateProvider authProvider,
            string collectionName)
        {
            _userDocs = userDocs;
            _authProvider = authProvider;
            _collectionName = collectionName;

            // Subscribe to auth changes
            _authProvider.AuthenticationStateChanged += HandleAuthStateChanged;
        }

        /// <summary>
        /// Loads items from Firestore into local cache if user is authenticated; otherwise clears cache.
        /// Called whenever AuthenticationStateChanged fires.
        /// </summary>
        private async void HandleAuthStateChanged(Task<AuthenticationState> task)
        {
            var state = await task;
            if (state.User.Identity?.IsAuthenticated == true)
            {
                // User just logged in → fetch collection
                try
                {
                    var fetched = await _userDocs.GetAsync<T>(_collectionName);
                    _items = fetched ?? new List<T>();
                }
                catch
                {
                    _items = new List<T>();
                }
            }
            else
            {
                // User logged out → clear local cache
                _items.Clear();
            }

            // Mark as initialized after the first auth change
            _isInitialized = true;

            // Notify subscribers
            OnUpdated?.Invoke();
        }

        /// <summary>
        /// Ensure initial load if the auth state was already authenticated before this service was constructed.
        /// Call this from DI or from a component after constructing the service.
        /// </summary>
        public async Task InitializeAsync()
        {
            if (_isInitialized)
                return;

            var state = await _authProvider.GetAuthenticationStateAsync();
            if (state.User.Identity?.IsAuthenticated == true)
            {
                try
                {
                    var fetched = await _userDocs.GetAsync<T>(_collectionName);
                    _items = fetched ?? new List<T>();
                }
                catch
                {
                    _items = new List<T>();
                }
            }
            else
            {
                _items.Clear();
            }

            _isInitialized = true;
            OnUpdated?.Invoke();
        }

        /// <summary>
        /// Adds a new item to Firestore and to the local cache.
        /// </summary>
        /// <param name="item">Item to add. Must include an Id property if you want to reference it later.</param>
        public async Task AddAsync(T item)
        {
            // Push to Firestore
            await _userDocs.AddAsync(_collectionName, item);

            // Update local cache
            _items.Add(item);
            OnUpdated?.Invoke();
        }

        /// <summary>
        /// Updates an existing document in Firestore and in local cache.
        /// Expects that T has a property "Id" of type string.
        /// </summary>
        /// <param name="id">Document ID in Firestore.</param>
        /// <param name="item">New data object.</param>
        public async Task UpdateAsync(string id, T item)
        {
            // Push update to Firestore
            await _userDocs.UpdateAsync(_collectionName, id, item);

            // Update local cache: find existing by Id and replace
            var prop = typeof(T).GetProperty("Id");
            if (prop != null)
            {
                var existing = _items.FirstOrDefault(i => prop.GetValue(i)?.ToString() == id);
                if (existing != null)
                {
                    var index = _items.IndexOf(existing);
                    _items[index] = item;
                    OnUpdated?.Invoke();
                }
            }
        }

        /// <summary>
        /// Deletes a document from Firestore and from local cache.
        /// </summary>
        /// <param name="id">Document ID in Firestore.</param>
        public async Task DeleteAsync(string id)
        {
            // Remove from Firestore
            await _userDocs.DeleteAsync(_collectionName, id);

            // Remove from local cache (expects property "Id")
            var prop = typeof(T).GetProperty("Id");
            if (prop != null)
            {
                _items.RemoveAll(i => prop.GetValue(i)?.ToString() == id);
                OnUpdated?.Invoke();
            }
        }

        /// <summary>
        /// Returns a snapshot of cached items.
        /// </summary>
        public Task<List<T>> GetAllAsync()
        {
            // Return a copy to prevent external mutation
            return Task.FromResult(_items.ToList());
        }

        /// <summary>
        /// Unsubscribe from AuthenticationStateChanged to avoid memory leaks.
        /// Called by the DI container when disposing this scoped service.
        /// </summary>
        public void Dispose()
        {
            _authProvider.AuthenticationStateChanged -= HandleAuthStateChanged;
        }
    }
}
