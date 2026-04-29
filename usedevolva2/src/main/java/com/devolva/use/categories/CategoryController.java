package com.devolva.use.categories;

import com.devolva.use.categories.domain.CategoryModel;
import com.devolva.use.categories.dtos.CreateCategoryDto;
import com.devolva.use.categories.usecases.CategoryUsecases;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryUsecases categoryUsecases;

    @PostMapping
    public ResponseEntity<CategoryModel> createCategory(@RequestBody CreateCategoryDto dto) {
        CategoryModel category = categoryUsecases.createCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @GetMapping
    public ResponseEntity<List<CategoryModel>> listAllCategories() {
        List<CategoryModel> categories = categoryUsecases.listAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryModel> getCategoryById(@PathVariable Long id) {
        Optional<CategoryModel> category = categoryUsecases.getCategoryById(id);
        if (category.isPresent()) {
            return ResponseEntity.ok(category.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}