package com.devolva.use.categories.repository;

import com.devolva.use.categories.domain.CategoryModel;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {
    CategoryModel save(CategoryModel category);
    List<CategoryModel> findAll();
    Optional<CategoryModel> findById(Long id);
    Optional<CategoryModel> findByNome(String nome);
    void deleteById(Long id);
}