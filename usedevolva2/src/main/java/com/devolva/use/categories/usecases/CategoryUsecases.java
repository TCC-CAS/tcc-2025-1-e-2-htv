package com.devolva.use.categories.usecases;

import com.devolva.use.categories.domain.CategoryModel;
import com.devolva.use.categories.dtos.CreateCategoryDto;
import com.devolva.use.categories.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryUsecases {

    @Autowired
    private CategoryRepository categoryRepository;

    public CategoryModel createCategory(CreateCategoryDto dto) {
        CategoryModel category = new CategoryModel();
        category.setNome(dto.nome());
        category.setDescricao(dto.descricao());
        return categoryRepository.save(category);
    }

    public List<CategoryModel> listAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<CategoryModel> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }
}