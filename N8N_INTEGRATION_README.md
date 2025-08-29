# n8n Materials Import Integration

This document explains how to integrate your n8n workflows with the materials management system to automatically import materials data.

## Overview

The system now includes a dedicated API endpoint for n8n webhook integration that allows you to automatically import materials from your n8n workflows. This is perfect for integrating with suppliers, estimating software, or any other system that can send webhook data.

## API Endpoint

**Endpoint:** `POST /api/projects/{projectId}/materials/import-n8n`

**Content-Type:** `application/json`

## Request Format

The endpoint expects an array of material objects in the request body:

```json
[
  {
    "name": "2x4x8 Pine Stud",
    "quantity": 50,
    "unit": "pieces",
    "cost": 8.50,
    "type": "Building Materials",
    "category": "Dimensional Lumber",
    "tier": "structural",
    "tier2Category": "framing",
    "section": "FIRST FLOOR",
    "subsection": "FIRST FLOOR - WALLS",
    "supplier": "84 Lumber Co.",
    "supplierId": null,
    "status": "quoted",
    "isQuote": true,
    "taskIds": [],
    "contactIds": [],
    "details": "Premium kiln-dried pine studs",
    "quoteDate": "2024-12-01",
    "quoteNumber": "QUOTE-2024-001",
    "orderDate": null
  }
]
```

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Material name/description |
| `quantity` | number | ✅ | Quantity required |
| `unit` | string | ❌ | Unit of measurement (pieces, sq ft, etc.) |
| `cost` | number | ❌ | Cost per unit |
| `type` | string | ❌ | Material type (defaults to "Building Materials") |
| `category` | string | ❌ | Material category (wood, electrical, plumbing, etc.) |
| `tier` | string | ❌ | Tier 1 category (structural, systems, sheathing, finishings) |
| `tier2Category` | string | ❌ | Tier 2 category (framing, electrical, plumbing, etc.) |
| `section` | string | ❌ | Project section (CRAWL SPACE, FIRST FLOOR, etc.) |
| `subsection` | string | ❌ | Project subsection (HEADERS, WALLS, etc.) |
| `supplier` | string | ❌ | Supplier name |
| `supplierId` | number | ❌ | Reference to supplier contact ID |
| `status` | string | ❌ | Material status (ordered, quoted, delivered, used) |
| `isQuote` | boolean | ❌ | Whether this is a quote (affects budget calculations) |
| `taskIds` | array | ❌ | Array of associated task IDs |
| `contactIds` | array | ❌ | Array of associated contact IDs |
| `details` | string | ❌ | Additional notes or details |
| `quoteDate` | string | ❌ | Quote date (YYYY-MM-DD format) |
| `quoteNumber` | string | ❌ | Quote reference number |
| `orderDate` | string | ❌ | Order date (YYYY-MM-DD format) |

## n8n Workflow Setup

### 1. Create HTTP Request Node

In your n8n workflow, add an **HTTP Request** node with these settings:

- **Method:** POST
- **URL:** `http://your-server-url:5000/api/projects/YOUR_PROJECT_ID/materials/import-n8n`
- **Send Body:** ✅
- **Body Content Type:** JSON

### 2. Prepare Your Data

Transform your data into the expected format using n8n's data transformation nodes. Here's an example workflow:

```
[Your Data Source] → [Data Transformation] → [HTTP Request] → [Success Handler]
```

### 3. Example n8n Data Transformation

If your source data looks like this:
```json
{
  "supplier_quote": {
    "items": [
      {
        "description": "2x4x8 Pine Stud",
        "qty": "50",
        "unit_price": "8.50",
        "supplier": "84 Lumber Co."
      }
    ]
  }
}
```

Transform it using a **Function** node:
```javascript
// Transform supplier data to materials format
const materials = items.map(item => ({
  name: item.description,
  quantity: parseInt(item.qty),
  unit: "pieces",
  cost: parseFloat(item.unit_price),
  type: "Building Materials",
  category: "Dimensional Lumber",
  tier: "structural",
  tier2Category: "framing",
  supplier: item.supplier,
  status: "quoted",
  isQuote: true,
  taskIds: [],
  contactIds: []
}));

return materials;
```

## Response Format

### Success Response (201 Created)
```json
{
  "message": "Successfully imported 3 of 3 materials from n8n",
  "imported": 3,
  "total": 3,
  "errors": null,
  "materials": [
    {
      "id": 123,
      "name": "2x4x8 Pine Stud",
      "quantity": 50,
      "cost": 8.50,
      "status": "quoted"
    }
  ],
  "projectId": 1
}
```

### Error Response (400/404/500)
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Error Handling

The endpoint includes comprehensive error handling:

- **Invalid Project ID:** Returns 404 if project doesn't exist
- **Invalid Data Format:** Returns 400 if request body isn't an array
- **Missing Required Fields:** Individual materials with missing names are skipped
- **Invalid Values:** Materials with invalid quantities/costs are skipped with error messages

## Validation Rules

- **Material Name:** Required, cannot be empty
- **Quantity:** Must be greater than 0
- **Cost:** Must be non-negative (0 or greater)
- **Arrays:** `taskIds` and `contactIds` must be arrays (default to empty arrays)
- **Dates:** `quoteDate` and `orderDate` should be in YYYY-MM-DD format

## Testing

A test script is included (`test-n8n-endpoint.js`) that you can run to verify the integration:

```bash
node test-n8n-endpoint.js
```

This will test:
- Successful material import
- Invalid data format rejection
- Invalid project ID rejection

## Security Considerations

- Ensure your n8n instance has proper authentication if needed
- Consider adding API key authentication to the endpoint for production use
- Validate webhook sources to prevent unauthorized imports

## Troubleshooting

### Common Issues

1. **"Project not found" error**
   - Verify the project ID exists in your system
   - Check the URL format: `/api/projects/{valid_project_id}/materials/import-n8n`

2. **"Request body must be an array" error**
   - Ensure you're sending an array of materials, not a single object
   - Check your n8n data transformation

3. **Materials not appearing in the system**
   - Check the response for error messages
   - Verify required fields (name, quantity) are present
   - Check server logs for detailed error information

### Debug Mode

Enable debug logging by checking the server console output when making requests. The endpoint logs:
- Parsed material count
- Individual material processing errors
- Import completion status

## Example n8n Workflow

Here's a complete example n8n workflow JSON:

```json
{
  "nodes": [
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:5000/api/projects/1/materials/import-n8n",
        "sendBody": true,
        "bodyContentType": "json",
        "body": "={{ $json.materials }}"
      }
    }
  ],
  "connections": {}
}
```

## Support

If you encounter issues with the n8n integration:
1. Check the server logs for detailed error messages
2. Verify your data format matches the expected schema
3. Test with the provided test script
4. Ensure the project ID is valid and exists in your system
