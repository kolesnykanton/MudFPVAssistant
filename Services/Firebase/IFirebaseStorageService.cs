using Microsoft.AspNetCore.Components.Forms;

namespace MudFPVAssistant.Services.Firebase;

public interface IFirebaseStorageService
{
    /// <summary>
    /// Завантажує у Firebase Storage файл і повертає публічний URL.
    /// </summary>
    /// <param name="path">шлях у сховищі, напр.: "spots/{spotId}/{filename}"</param>
    /// <param name="file">IBrowserFile, вибраний користувачем</param>
    Task<string> UploadAsync(string path, IBrowserFile file);

    /// <summary>
    /// Видаляє файл із Firebase Storage за публічним URL або шляхом.
    /// </summary>
    Task DeleteAsync(string url);
}