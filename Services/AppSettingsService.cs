// Services/AppSettingsService.cs

using System;
using System.Linq;
using System.Threading.Tasks;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Services
{
    public class AppSettingsService
    {
        private readonly ReactiveUserCollectionService<UserSettings> _svc;

        public AppSettingsService(
            ReactiveUserCollectionService<UserSettings> settingsSvc)
        {
            _svc = settingsSvc;
            _svc.OnUpdated += () =>
            {
                if (_svc.Items.Any())
                    OnSettingsChanged?.Invoke();
            };
        }

        /// <summary>Викликається після завантаження або оновлення документа.</summary>
        public event Action? OnSettingsChanged;

        /// <summary>Чи завантажено хоча б один документ налаштувань?</summary>
        public bool HasSettings => _svc.Items.Any();

        /// <summary>Поточний документ (гарантовано є після EnsureLoadedAsync).</summary>
        public UserSettings Current => _svc.Items.First();

        /// <summary>
        /// Завантажує дані з Firestore; якщо колекція порожня — створює дефолтний документ.
        /// </summary>
        public async Task EnsureLoadedAsync()
        {
            await _svc.InitializeAsync();

            if (!_svc.Items.Any())
            {
                await _svc.AddAsync(new UserSettings());
            }
        }

        /// <summary>Оновлює весь документ одним викликом.</summary>
        public Task UpdateAsync(UserSettings updated)
            => _svc.UpdateAsync(Current.Id, updated);
    }
}