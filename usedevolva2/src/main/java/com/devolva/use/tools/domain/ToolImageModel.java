package com.devolva.use.tools.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tool_images")
public class ToolImageModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long toolId;

    private String fileName;

    private String filePath;

    private String contentType;
}