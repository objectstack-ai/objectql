# Data Modeling Guide

Modeling your business data is the first step in building an ObjectQL application. This guide introduces the core concepts.

## 1. Objects

An **Object** is like a database table. It represents a business entity, such as a Customer, Order, or Product.

```yaml
# customer.object.yml
name: customer
label: Customer
icon: user
description: Stores customer information.
fields:
  name:
    type: text
    label: Full Name
    required: true
```

## 2. Fields

Fields store the data attributes for an object. ObjectQL provides a rich set of field types.

### 2.1 Basic Types
*   **Text & Area**: `text`, `textarea`, `markdown`, `html`
*   **Numbers**: `number`, `currency`, `percent`
*   **Switch**: `boolean` (checkbox)
*   **Date**: `date`, `datetime`, `time`
*   **System**: `password`, `auto_number`

### 2.2 Format Types
These types provide automatic validation and formatted display.
*   **Email** (`email`): Validates email addresses.
*   **Phone** (`phone`): Stores phone numbers.
*   **URL** (`url`): Validates web links.

### 2.3 Media & Files
*   **File** (`file`): Upload generic documents.
*   **Image** (`image`): Upload pictures with preview support.
*   **Avatar** (`avatar`): User profile pictures.

*Note: You can allow multiple files/images by setting `multiple: true`.*

### 2.4 Location
*   **Location** (`location`): Stores Latitude and Longitude. Useful for maps.

### 2.5 Calculations
*   **Formula**: Calculate values automatically based on other fields.
    *   Example: `Total` = `Price` * `Quantity`
*   **Summary**: Aggregate data from child records (e.g., Total Order Amount for a Customer).

## 3. Relationships

Linking objects together is powerful.

*   **Lookup**: A simple link to another object. (e.g., An Order looks up a Customer).
*   **Master-Detail**: A strong parent-child relationship. If the parent is deleted, children are deleted.

```yaml
# order.object.yml
fields:
  customer:
    type: lookup
    reference_to: customer
    label: Customer
```

## 4. Attributes

You can enforce rules on your data using attributes:

*   `required`: Cannot be empty.
*   `unique`: Must be unique in the whole table.
*   `min`, `max`: Range validation for numbers.
*   `defaultValue`: Automatic initial value.
*   `hidden`: Hide from standard UI.
*   `readonly`: Prevent editing in UI.

