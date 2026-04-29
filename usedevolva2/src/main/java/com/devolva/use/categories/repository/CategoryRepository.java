package com.devolva.use.categories.repository;

import com.devolva.use.categories.domain.CategoryModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<CategoryModel, Long> {
    List<CategoryModel> findAll();
    Optional<CategoryModel> findById(Long id);
}