# Material Creation Debug Checklist

Since you mentioned you can't add new materials, let's troubleshoot this step by step:

## 1. Basic Checks

### Check if the server is running:
- Open your browser and go to `http://localhost:5000/api/projects`
- You should see a JSON response with your projects
- If you get an error, the server isn't running

### Check the browser console:
1. Open the materials page in your browser
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Try to add a material
5. Look for any red error messages

## 2. Frontend Issues to Check

### Material Dialog Opens:
- Does the "Add Material" button show the dialog?
- If not, there might be a JavaScript error

### Form Validation:
- Can you fill out all required fields?
- Are there any red validation error messages?
- Required fields: Material Name, Material Type, Project

### Specific Fields to Check:
1. **Project Selection**: Make sure you select a project
2. **Material Name**: Must be at least 2 characters
3. **Material Type**: Must select from dropdown
4. **Category**: Should auto-populate based on type

## 3. Network Issues to Check

### In Browser Developer Tools (F12):
1. Go to "Network" tab
2. Try to create a material
3. Look for a POST request to `/api/materials`
4. Check the response:
   - Status 200/201 = Success
   - Status 400 = Validation error
   - Status 500 = Server error

## 4. Common Issues and Solutions

### Issue: "Material name must be at least 2 characters"
- **Solution**: Make sure the material name field has content

### Issue: "Project ID is required" 
- **Solution**: Make sure you selected a project in the dropdown

### Issue: "Category is required"
- **Solution**: Make sure you selected both Material Type and Sub Type

### Issue: Network error or 500 status
- **Solution**: Check server console logs for detailed error

### Issue: Form doesn't submit at all
- **Solution**: Check browser console for JavaScript errors

## 5. Step-by-Step Test

Try creating a simple material with these exact values:

```
Tab 1 - Project Setup:
- Project: [Select any project]
- Primary Task Type: structural
- Secondary Task Type: framing

Tab 2 - Material Details:
- Material Name: Test Lumber
- Supplier: Home Depot
- Material Type: Building Materials
- Material Sub Type: Lumber & Composites

Tab 3 - Inventory & Cost:
- Quantity: 10
- Status: Ordered
- Unit: Pieces
- Cost per Unit: 5.99

Tab 4 - Contractors:
- Leave empty or select any contractor

Then click "Add to Inventory"
```

## 6. What to Report

If it still doesn't work, please report:

1. **Browser Console Errors**: Any red text in F12 Console tab
2. **Network Response**: Status code and response from Network tab
3. **Which Step Fails**: Where exactly does the process break?
4. **Form Values**: What values you entered in each field

## 7. Emergency Workaround

If the dialog isn't working, you can try:
1. Going to `/materials` page directly
2. Using the materials import feature instead
3. Checking if materials show up in the database even if the UI doesn't update

Let me know what you find from these checks!