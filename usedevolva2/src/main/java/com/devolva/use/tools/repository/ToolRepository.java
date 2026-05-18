package com.devolva.use.tools.repository;

import com.devolva.use.tools.domain.ToolModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ToolRepository extends JpaRepository<ToolModel, Long> {

    List<ToolModel> findByOwnerId(Long ownerId);

    List<ToolModel> findByOwnerIdAndAtivoTrue(Long ownerId);

    long countByOwnerIdAndAtivoTrue(Long ownerId);

    List<ToolModel> findByAtivoTrueAndDisponivelTrue();

    @Query("""
        SELECT t FROM ToolModel t
        WHERE t.ativo = true
        AND t.bloqueadaTemporariamente = false
        AND (:disponivel IS NULL OR t.disponivel = :disponivel)
        AND (:busca IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', :busca, '%'))
             OR LOWER(t.descricao) LIKE LOWER(CONCAT('%', :busca, '%')))
        AND (:categoria IS NULL OR LOWER(t.categoria) = LOWER(:categoria))
        AND (:estadoConservacao IS NULL OR LOWER(t.estadoConservacao) = LOWER(:estadoConservacao))
        AND (:valorMinimo IS NULL OR t.valorDiaria >= :valorMinimo)
        AND (:valorMaximo IS NULL OR t.valorDiaria <= :valorMaximo)
        ORDER BY t.createdAt DESC
    """)
    List<ToolModel> searchTools(
            @Param("busca") String busca,
            @Param("categoria") String categoria,
            @Param("estadoConservacao") String estadoConservacao,
            @Param("valorMinimo") BigDecimal valorMinimo,
            @Param("valorMaximo") BigDecimal valorMaximo,
            @Param("disponivel") Boolean disponivel
    );

    default long countActiveToolsByOwnerId(Long ownerId) {
        return countByOwnerIdAndAtivoTrue(ownerId);
    }
}