using Microsoft.AspNetCore.Components.Forms;
using Microsoft.JSInterop;

namespace MudFPVAssistant.Services.Firebase;

public class FirebaseStorageService : IFirebaseStorageService
{
    private readonly IJSRuntime _js;

    public FirebaseStorageService(IJSRuntime js) => _js = js;

/// <summary>
/// Uploads IBrowserFile to storage
/// </summary>
/// <param name="path"></param>
/// <param name="file"></param>
/// <returns></returns>
    public async Task<string> UploadAsync(string path, IBrowserFile file)
    {
        using var stream = file.OpenReadStream(10 * 1024 * 1024);
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        var base64 = Convert.ToBase64String(ms.ToArray());
        var contentType = file.ContentType;
        return await _js.InvokeAsync<string>(
            "uploadToFirebaseStorage",
            path,
            base64,
            contentType);    }

    public async Task DeleteAsync(string path)
    {
        await _js.InvokeVoidAsync("deleteFromFirebaseStorage", path);
    }
}
